import { Connection, Model, PaginateModel, PaginateOptions } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CreateInfluencerDto, CreateJobRequestDto, UpdateInfluencerDto } from './app.dto';
import { Influencer, InfluencerModelInterface, Review, ReviewModelName } from './app.schema';
import { addDays } from 'date-fns';
import { DeepRequired } from 'ts-essentials';
import { INFLUENCER_RESPONSE } from './app.response';
import { LogService, Logger } from '@core/logger';
import { PopulateOptions } from './common/helpers';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { APP_CONFIG } from './app.constants';
import { JobRequest, JobRequestModelInterface, JOBREQUEST_STATUS } from './schema/request.schema';
import { AppPipeline } from './app.pipeline';
// import { CachingService } from '@libs/modules/caching';

@Injectable()
export class AppService {
  @Logger(AppService.name)private logger = new LogService();

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Influencer.name) public readonly influencerModel: InfluencerModelInterface,
    
    @InjectModel(ReviewModelName) public readonly reviewModel: Model<Review>,

    @InjectModel(JobRequest.name) public readonly jobRequestModel: JobRequestModelInterface,
    
    @Inject(APP_CONFIG.NOTIFICATION_SERVICE) private readonly notificationClient: ClientProxy,
    // private cache: CachingService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(createInfluencerDto: DeepRequired<CreateInfluencerDto> & { userId: string }) {
    
    const session = await this.connection.startSession();

    session.startTransaction();

    try {
      const [influencer] = await this.influencerModel.create([createInfluencerDto], { session });

      await this.connection.db.collection('users').findOneAndUpdate({ userId: influencer.userId }, { $set: {
        influencerId: influencer.influencerId
      } }, { session });

      await session.commitTransaction();
      session.endSession();

      this.eventEmitter.emit(INFLUENCER_RESPONSE.LOG.CREATE, influencer);
    
      return influencer;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.log(error.message);
      if (error.message.includes('collection') || error.message.includes('iynfluencer')) throw error;

      throw new InternalServerErrorException('Error occured while trying to create a Influencer Account! Try again later.');
    }
  }

  async getAll(query?: Record<string, any>, paginateOptions: PaginateOptions = {}) {

    const {page, limit, select, sort, ...rest} = query;

    return await AppPipeline(this.influencerModel).getAll({ ...rest, suspended: false }, paginateOptions);
  }
  

  async getOne(id: string, populateOptions: PopulateOptions = []) {

    const query = {$or: [
      { _id: id || '', suspended: false },
      { influencerId: id || '', suspended: false }
    ]};

    const influencer = await AppPipeline(this.influencerModel).getOne(query, populateOptions);

    if (!influencer) {
      throw new NotFoundException('Influencer Not Found');
    }

    return influencer;
  }

  async getByUser(userId: string, populateOptions: PopulateOptions = []) {
    const influencer = await this.influencerModel.findOne({ userId }).populate(populateOptions);

    if (!influencer) {
      throw new NotFoundException('Influencer Not Found');
    }

    return influencer;
  }
  
  async getMe(id: string, populateOptions: PopulateOptions = []) {
    const influencer = await this.influencerModel.findOne({$or: [
      { _id: id || '' },
      { influencerId: id || '' }
    ]}).populate(populateOptions);

    if (!influencer) {
      throw new NotFoundException('Influencer Not Found');
    }

    return influencer;
  }
  
  async iamSuspended(influencerId: string, populateOptions: PopulateOptions = []) {
    const influencer = await this.getMe(influencerId, populateOptions);
    
    if (influencer.suspended) {
      throw new ForbiddenException('Influencer has been suspended!');
    }

    return influencer;
  }

  async update(id: string, updateInfluencerDto: UpdateInfluencerDto & { suspended?: boolean }) {
    const influencer = await this.iamSuspended(id);

    return await this.influencerModel.findOneAndUpdate({ _id: influencer._id }, { ...updateInfluencerDto }, {
      new: true,
      runValidators: true
    })

  }

  remove(id: string) {
    
    return `This action removes a #${id} influencer`;
  }


  async postReview(createReview: any) {
    try {
      const review =  await this.reviewModel.create(createReview);
         
      return { message: 'review added', review }

    } catch (error) {

      console.log(error.message);

      throw new InternalServerErrorException('Error occured while trying to create a review! Try again later.');
    }
  }
  
  async getReview(jobid: string,  populateOptions: PopulateOptions = []) {

    const review = await this.reviewModel.findOne({ jobId: jobid })
    .populate(populateOptions)
    .populate({ path: 'creator', populate: { path: 'user' } })
    .populate({ path: 'influencer', populate: { path: 'user' } })
    .exec();
    
    if (!review) {
      return { message: 'Review not found' };
    }

    return review;
  }

  async editReview(reviewId: string, reviewDto: any) {

    return await this.reviewModel.findOneAndUpdate({ _id: reviewId }, { ...reviewDto }, {
      new: true,
      runValidators: true
    })

  }

  async deleteReview() {

    return await await this.reviewModel.deleteMany({});

  }
}
