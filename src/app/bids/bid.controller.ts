import { BadRequestException, Body, Controller, ForbiddenException, Get, Inject, NotFoundException, Param, Patch, Post, Query, Req, UseFilters, UsePipes } from '@nestjs/common';
import { BidService } from './bid.service';
import { Response } from '@core/common/interceptors/response';
import { HttpValidationFilter, MongooseExceptionFilter } from '@core/common/filters';
import { ApiTags } from '@nestjs/swagger';
import { TAGS } from '@app/common/constants';
import { LogService, Logger } from '@core/logger';
import { BID_RESPONSE } from './bid.response';
import { DeepRequired } from 'ts-essentials';

import { Protect, Public } from '@core/auth/decorators';
import { QueryOptions } from '@app/common/helpers';

export const bidsRoute = TAGS.BIDS.toLowerCase();
export const hiredRoute = TAGS.HIRED.toLowerCase();

@Protect()
@ApiTags(`${TAGS.BIDS}`)
@UseFilters(HttpValidationFilter)
@UseFilters(MongooseExceptionFilter)
@Controller(`${bidsRoute}`)
// @UsePipes(ZodValidationPipe)
export class BidController {

  @Logger(BidController.name)private logger = new LogService();

  constructor(private readonly bidService: BidService) {
  }
  

  @Get()
  @Response(BID_RESPONSE.UPDATE)
  async getBid(@Query() query) {
    const { otherQuery, paginateOptions } = QueryOptions(query, true);
    
    paginateOptions.populate = [
      { path: 'influencer' },
    ];


    return await this.bidService.getAll(otherQuery, paginateOptions);
  }

  @Public()
  @Get(':id/single')
  @Response(BID_RESPONSE.FIND_ONE_BY_ID)
  getCreator(@Param('id') id: string, @Req() req) {
    const populate = [
      { path: 'influencer' },
    ];
    return this.bidService.getOne(id, populate);
  }
}
