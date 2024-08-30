import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Patch, Post, Query, Req, UseFilters, UsePipes } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from '@core/common/interceptors/response';
import { E_RESPONSE } from '@core/modules/message';
import { HttpValidationFilter, MongooseExceptionFilter } from '@core/common/filters';
import { ApiTags } from '@nestjs/swagger';
import { TAGS } from '@app/common/constants';
import { EventPattern, MessagePattern } from '@nestjs/microservices';
import { LogService, Logger } from '@core/logger';
import { INFLUENCER_RESPONSE } from './app.response';
import { QueryOptions } from './common/helpers';
import { Protect, Public } from '@core/auth/decorators';


@Protect()
@ApiTags(TAGS.DEFAULT)
@UseFilters(HttpValidationFilter)
@UseFilters(MongooseExceptionFilter)
@Controller()
// @UsePipes(ZodValidationPipe)
export class AppController {

  @Logger(AppController.name) private logger = new LogService();

  constructor(private readonly appService: AppService) {
  }

  @Get()
  @Response(INFLUENCER_RESPONSE.FIND_ALL)
  async getAll(@Query() query, @Req() req) {
    const { otherQuery, paginateOptions } = QueryOptions(query, true);
    
    const influencerId = req.user.influencerId;

    paginateOptions.populate = [
      { path: 'user', select: ['firstName', 'lastName', 'avatar', 'country', 'userId'] },
      { path: 'jobsCompleted' }
    ];

    if (Array.isArray(otherQuery.niche) && otherQuery.niche.length > 0) {
      otherQuery.niche = { in: otherQuery.niche };
    }

    if (influencerId) otherQuery.influencerId = { ne: influencerId };

    return await this.appService.getAll(otherQuery, paginateOptions);
  }


  @Get(':_id/single')
  @Response(INFLUENCER_RESPONSE.FIND_ONE_BY_ID)
  getInfluencer(@Param('_id') id: string) {
    const populate = [
      { path: 'user', select: ['firstName', 'lastName', 'avatar', 'country', 'userId'] },
      { path: 'jobsCompleted' }
    ];
    return this.appService.getOne(id, populate);
  }
}
