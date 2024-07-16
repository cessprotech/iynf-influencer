import { Connection, Model, PaginateModel, PaginateOptions } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CreateBidDto, UpdateBidDto } from './bid.dto';
import { Bid, BidModelInterface } from './bid.schema';
import { BID_RESPONSE } from './bid.response';
import { LogService, Logger } from '@core/logger';
import { PopulateOptions } from '@app/common/helpers';
import { AppService } from '@app/app.service';
import { HIRED_STATUS, Hired, HiredModelInterface } from './hired.schema';
import { MSResponse } from '@core/common/interfaces';
import { CreatorMService } from '../mservices/creator.m.service';
// import { CachingService } from '@libs/modules/caching';

@Injectable()
export class BidService {
  @Logger(BidService.name)private logger = new LogService();

  constructor(
    @InjectConnection() private readonly connection: Connection,

    @InjectModel(Bid.name) public readonly bidModel: BidModelInterface,
    
    @InjectModel(Hired.name) public readonly hiredModel: HiredModelInterface,

    private readonly appService: AppService,
    
    private readonly creatorMService: CreatorMService,
    // private cache: CachingService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createBidDto: CreateBidDto, user: { influencerId: string, creatorId: string }) {

    const { influencerId, creatorId } = user;

    await this.appService.iamSuspended(influencerId);

    const job = await this.creatorMService.getJob(createBidDto.jobId);

    if (job.creatorId === creatorId) throw new ForbiddenException('You cannot perform this operation. You cannot bid a job you created.');

    const bidExists = await this.bidExists(job.jobId, influencerId);

    if (bidExists) throw new BadRequestException('You cannot bid more than once. You can update your bid.');
    
    const bid = await this.bidModel.create({ ...createBidDto, influencerId });

    this.eventEmitter.emit(BID_RESPONSE.LOG.CREATE, bid);
    
    return bid;
  }

  async getAll(query: Record<string, any> = {}, paginateOptions: PaginateOptions = {}) {

    const {page, limit, select, sort, ...rest} = query;

    return await this.bidModel.paginate({...rest, suspended: false }, paginateOptions);
  }
  
  async getMyBids(query: Record<string, any> = {}, influencerId: string, paginateOptions: PaginateOptions = {}) {

    const {page, limit, select, sort, ...rest} = query;

    return await this.bidModel.paginate({...rest, influencerId }, paginateOptions);
  }
  

  async getOne(id: string, populateOptions: PopulateOptions = []) {
    const bid = await this.bidModel.findOne({$or: [
      { _id: id || '' },
      { bidId: id || '' }
    ]}).populate(populateOptions);

    if (!bid) {
      throw new NotFoundException('Bid Not Found');
    }

    return bid;
  }
  
  async bidExists(jobId: string, influencerId: string) {
    const bid = await this.bidModel.findOne({ jobId, influencerId });

    if (!bid) return false;

    return true;
  }

  async getMyBid(id: string, influencerId: string, populateOptions: PopulateOptions = []) {
    const bid = await this.bidModel.findOne({$or: [
      { _id: id || '', influencerId },
      { bidId: id || '', influencerId }
    ]}).populate(populateOptions);

    if (!bid) {
      throw new NotFoundException('Bid Not Found');
    }

    return bid;
  }
  
  async bidNotFoundOrExpired(id: string, influencerId?: string, populateOptions: PopulateOptions = []) {
    let query: Record<string, any>[] = [
      { _id: id || '' },
      { bidId: id || '' }
    ];

    if (influencerId) query = [
      { _id: id || '', influencerId },
      { bidId: id || '', influencerId }
    ]

    const bid = await this.bidModel.findOne({ $or: query }).populate(populateOptions);

    if (!bid) {
      throw new NotFoundException('Bid Not Found.');
    }

    if (bid.hired !== undefined) {
      throw new ForbiddenException('Bid expired. Job has been taken!');
    }

    return bid;
  }

  async update(id: string, influencerId: string, updateBidDto: UpdateBidDto) {
  
    await this.appService.iamSuspended(influencerId);

    const bid = await this.bidNotFoundOrExpired(id, influencerId);

    return await this.bidModel.findOneAndUpdate({ bidId: bid.bidId }, { ...updateBidDto }, {
      new: true,
      runValidators: true
    })

  }

  // just to update every data in the document
  async updateAllBids() {
    return await this.bidModel.findOneAndUpdate({ _id: '664fad059ff780ac169f4ce7' }, 
      { paymentStatus: true }, {
      new: true,
      runValidators: true
    })

  }

  async delete(id: string, influencerId: string) {
    
    const bid = await this.bidNotFoundOrExpired(id, influencerId);

    return await this.bidModel.findOneAndDelete({ bidId: bid.bidId });
  }

  // HIRED METHODS
  async acceptABid(id: string) {
    
    const bid = await this.bidNotFoundOrExpired(id);

    await this.appService.iamSuspended(bid.influencerId);

    return bid;
  }

  async getMyHires(query: Record<string, any> = {}, influencerId: string, paginateOptions: PaginateOptions = {}) {

    const {page, limit, select, sort, ...rest} = query;

    return await this.hiredModel.paginate({ ...rest, influencerId }, paginateOptions);
  }

  async getMyHire(id: string, influencerId: string, populateOptions: PopulateOptions = []) {
    const hired = await this.hiredModel.findOne({$or: [
      { _id: id || '', influencerId },
      { hiredId: id || '', influencerId }
    ]}).populate(populateOptions);

    if (!hired) {
      throw new NotFoundException('Job Not Found');
    }

    return hired;
  }
  
  async isCompleted(id: string, influencerId: string, populateOptions: PopulateOptions = []) {
    const hired = await this.getMyHire(id, influencerId);

    if (hired.creatorStatus) throw new BadRequestException('You cannot update a job marked as completed by client.');

    return hired;
  }

  async completeJob(id: string, influencerId: string) {
    const hired = await this.isCompleted(id, influencerId);

    await this.creatorMService.getJob(hired.jobId);

    return await this.hiredModel.findOneAndUpdate({ hiredId: hired.hiredId }, { $set: { influencerStatus: true } }, {
      new: true,
      runValidators: true
    })
  }
  
  async disputeJob(id: string, influencerId: string) {
    const hired = await this.getMyHire(id, influencerId);

    await this.creatorMService.getJob(hired.jobId);
  }
}
