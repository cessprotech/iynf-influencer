import { BadRequestException, Body, Controller, ForbiddenException, Get, Inject, NotFoundException, Param, Patch, Post, Delete, Query, Req, UseFilters, UsePipes } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from '@core/common/interceptors/response';
import { HttpValidationFilter, MongooseExceptionFilter } from '@core/common/filters';
import { ApiTags } from '@nestjs/swagger';
import { TAGS } from '@app/common/constants';
import { LogService, Logger } from '@core/logger';
import { INFLUENCER_RESPONSE } from './app.response';
import { CreateInfluencerDto, UpdateInfluencerDto } from './app.dto';
import { DeepRequired } from 'ts-essentials';

import { Iam, Protect, Public } from '@core/auth/decorators';
import { APP_CONFIG } from './app.constants';
import { CreatorMService } from './mservices/creator.m.service';
import { JobRequestService } from './services/job-request.service';
import { CreateBidDto, UpdateBidDto } from './bids/bid.dto';
import { BID_RESPONSE } from './bids/bid.response';
import { bidRoute } from './bids/bid.m.controller';
import { BidService } from './bids/bid.service';
import { QueryOptions } from './common/helpers';

@Protect()
@ApiTags(`${TAGS.DEFAULT}/ME`)
@UseFilters(HttpValidationFilter)
@UseFilters(MongooseExceptionFilter)
@Controller(`me`)
// @UsePipes(ZodValidationPipe)
export class MeController {

  @Logger(MeController.name) private logger = new LogService();

  constructor(
    private readonly appService: AppService,
    private readonly bidService: BidService,
    private readonly jobRequestService: JobRequestService,

  ) {
  }
  @Post()
  @Response(INFLUENCER_RESPONSE.CREATE)
  createInfluencer(@Body() body: CreateInfluencerDto, @Req() req) {
    let createInfluencerDto = body as unknown as DeepRequired<CreateInfluencerDto> & { userId: string };

    createInfluencerDto.userId = req.user.userId;

    return this.appService.create(createInfluencerDto);
  }

  @Get()
  @Iam()
  @Response(INFLUENCER_RESPONSE.FIND_ONE_BY_ID)
  getInfluencer(@Req() req) {
    return this.appService.getMe(req.user.influencerId);
  }

  @Patch()
  @Iam()
  @Response(INFLUENCER_RESPONSE.UPDATE)
  updateInfluencer(@Body() body: UpdateInfluencerDto, @Req() req) {
    return this.appService.update(req.user.influencerId, body);
  }

  //BIDS

  @Post(`${bidRoute}`)
  @Iam()
  @Response(BID_RESPONSE.CREATE)
  async bidJob(@Body() body: CreateBidDto, @Req() req) {
    return await this.bidService.create(body, { creatorId: req.user.creatorId, influencerId: req.user.influencerId });
  }

  @Get(`${bidRoute}`)
  @Iam()
  @Response(BID_RESPONSE.FIND_ALL)
  async myBids(@Query() query, @Req() req) {

    const { otherQuery, paginateOptions } = QueryOptions(query, true);

    otherQuery.influencerId = req.user.influencerId;

    paginateOptions.populate = [
      { path: 'job' },
    ];

    return await this.bidService.getAll(otherQuery, paginateOptions);
  }

  @Get(`${bidRoute}/:id/single`)
  @Iam()
  @Response(BID_RESPONSE.FIND_ONE_BY_ID)
  async getBid(@Param('id') id, @Req() req) {


    const populate = [
      { path: 'job' },
    ];

    return await this.bidService.getMyBid(id, req.user.influencerId, populate);
  }

  @Patch(`${bidRoute}/:id/single`)
  @Iam()
  @Response(BID_RESPONSE.UPDATE)
  async updateBid(@Param('id') id, @Body() body: UpdateBidDto, @Req() req) {

    return await this.bidService.update(id, req.user.influencerId, body);
  }

  // JOB REQUESTS
  @Get('jobs/requests')
  // @Iam()
  @Response(INFLUENCER_RESPONSE.DEFAULT)
  async getJobRequests(@Query() query, @Req() req) {
    const { otherQuery, paginateOptions } = QueryOptions(query, true);

    otherQuery.influencerId = req.user.influencerId;

    paginateOptions.populate = [
      { path: 'job' },
      { path: 'creatorUserData', select: 'firstName lastName avatar cover' }
    ];

    return await this.jobRequestService.getJobRequests(otherQuery, paginateOptions);
  }

  @Post(`jobs/request/:id/bid`)
  @Iam()
  @Response(INFLUENCER_RESPONSE.DEFAULT)
  async bidJobRequest(@Param('id') id, @Body() body: CreateBidDto, @Req() req) {
    return await this.jobRequestService.bidJobRequest(body, { influencerId: req.user.influencerId, creatorId: req.user.creatorId }, id);
  }

  @Post(`jobs/request/:id/decline`)
  @Iam()
  @Response(INFLUENCER_RESPONSE.DEFAULT)
  async declineJobRequest(@Param('id') id, @Req() req) {
    return await this.jobRequestService.declineJobRequest(id);
  }

  @Post(`jobs/postreview`)
  @Iam()
  async postReview(@Body() body) {
    return await this.appService.postReview(body);
  }

  @Get(`jobs/review/:jobid`)
  @Iam()
  @Response(INFLUENCER_RESPONSE.DEFAULT)
  async getReview(@Param('jobid') jobid) {

    const populate = [
      { path: 'influencer' },
      { path: 'creator' },
    ];

    return await this.appService.getReview(jobid, populate);
  }

  @Patch(`jobs/review/:reviewid`)
  @Iam()
  @Response(INFLUENCER_RESPONSE.DEFAULT)
  async editReview(@Param('reviewid') reviewId, @Body() body) {
    return await this.appService.editReview(reviewId, body);
  }
  
  @Delete(`jobs/review`)
  @Iam()
  @Response(INFLUENCER_RESPONSE.DEFAULT)
  async deleteReview() {
    return await this.appService.deleteReview();
  }
}
