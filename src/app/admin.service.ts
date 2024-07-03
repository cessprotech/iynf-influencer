import { Connection, Model, PaginateModel, PaginateOptions } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CreateInfluencerDto, CreateJobRequestDto, UpdateInfluencerDto } from './app.dto';
import { Influencer, InfluencerModelInterface } from './app.schema';
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
export class AdminService {
  @Logger(AdminService.name)private logger = new LogService();

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(Influencer.name) public readonly influencerModel: InfluencerModelInterface,

    @InjectModel(JobRequest.name) public readonly jobRequestModel: JobRequestModelInterface,
    
    @Inject(APP_CONFIG.NOTIFICATION_SERVICE) private readonly notificationClient: ClientProxy,
    // private cache: CachingService,
    private eventEmitter: EventEmitter2,
  ) {}


  async getAll(query?: Record<string, any>, paginateOptions: PaginateOptions = {}) {

    const {page, limit, select, sort, ...rest} = query;

    console.log(query, 'ggggggg');
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

//   async getByUser(userId: string, populateOptions: PopulateOptions = []) {
//     const influencer = await this.influencerModel.findOne({ userId }).populate(populateOptions);

//     if (!influencer) {
//       throw new NotFoundException('Influencer Not Found');
//     }

//     return influencer;
//   }
  
}
