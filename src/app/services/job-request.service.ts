import { Connection, Model, PaginateModel, PaginateOptions } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CreateJobRequestDto } from '../app.dto';

import { LogService, Logger } from '@core/logger';
import { ClientProxy } from '@nestjs/microservices';
import { APP_CONFIG } from '../app.constants';
import { JobRequest, JobRequestModelInterface, JOBREQUEST_STATUS } from '../schema/request.schema';
import { AppService } from '@app/app.service';
import { BidService } from '@app/bids/bid.service';
import { CreateBidDto } from '@app/bids/bid.dto';
import { CreatorMService } from '@app/mservices/creator.m.service';
// import { CachingService } from '@libs/modules/caching';

@Injectable()
export class JobRequestService {
  @Logger(JobRequestService.name)private logger = new LogService();

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(JobRequest.name) public readonly jobRequestModel: JobRequestModelInterface,

    private readonly appService: AppService,

    private readonly bidService: BidService,

    private readonly creatorMService: CreatorMService,
    
    @Inject(APP_CONFIG.NOTIFICATION_SERVICE) private readonly notificationClient: ClientProxy,
    // private cache: CachingService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createJobRequest(jobRequestDto: CreateJobRequestDto) {
    
    await this.appService.iamSuspended(jobRequestDto.influencerId);

    const jobRequestExists = await this.jobRequestExists(jobRequestDto.jobId, jobRequestDto.influencerId);

    if (jobRequestExists) throw new BadRequestException('Job request has been sent before.');
    

    const jobRequest = await this.jobRequestModel.create({
      ...jobRequestDto
    });

    return jobRequest;
  }

  async getJobRequests(query?: Record<string, any>, paginateOptions: PaginateOptions = {}) {

    const {page, limit, select, sort, ...rest} = query;

    return await this.jobRequestModel.paginate({ ...rest }, paginateOptions);
  }

  async bidJobRequest(bidJobRequest: CreateBidDto, user: {influencerId: string, creatorId: string }, jobRequestId: string) {
    
    const { influencerId, creatorId } = user;

    const job = await this.creatorMService.getJob(bidJobRequest.jobId);

    if (job.creatorId === creatorId) throw new ForbiddenException('You cannot perform this operation. You cannot bid a job request you created.');
    
    await this.appService.iamSuspended(influencerId);

    const jobRequest = await this.jobRequestModel.findOne({ jobRequestId, influencerId, declined: false });

    if (!jobRequest) throw new NotFoundException('Job Request Not Found');

    const bidExists = await this.bidService.bidExists(job.jobId, influencerId);

    if (bidExists) throw new BadRequestException('You cannot bid more than once. You can update your bid.');

    const session = await this.connection.startSession();

    session.startTransaction();

    try {
      const [bid] = await this.bidService.bidModel.create([{ ...bidJobRequest, influencerId }], { session });

    await this.jobRequestModel.findOneAndUpdate({ jobRequestId: jobRequest.jobRequestId }, { $set: {
      status: JOBREQUEST_STATUS.BIDDED,
      bidId: bid.bidId,
    }}, { new: true, runValidators: true, session });

    await session.commitTransaction();
    session.endSession();

    return jobRequest;

    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.log(error.message);
      if (error.message.includes('collection') || error.message.includes('iynfluencer')) throw error;

      throw new InternalServerErrorException('Error occured while trying to bid on a job request! Try again later.');
    }
  }
  
  async declineJobRequest(jobRequestId: string) {

    const jobRequest = await this.jobRequestModel.findOneAndUpdate({ jobRequestId }, { $set: {
      status: JOBREQUEST_STATUS.DECLINED
    }});

    if (!jobRequest) throw new NotFoundException('Job Request Not Found');

    return jobRequest;
  }

  async jobRequestExists(jobId: string, influencerId: string) {
    const jobRequest = await this.jobRequestModel.findOne({ jobId, influencerId });

    if (!jobRequest) return false;

    return true;
  }
}
