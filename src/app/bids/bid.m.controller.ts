import { Controller } from '@nestjs/common';
import { BidService } from './bid.service';
import { ApiTags } from '@nestjs/swagger';
import { TAGS } from '@app/common/constants';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { LogService } from '@core/logger';
import { MSController } from '@app/common/helpers';

export const bidRoute = `${TAGS.BIDS.toLowerCase()}`;
@ApiTags(TAGS.BIDS)
@Controller()
@MSController()
// @UsePipes(ZodValidationPipe)
export class BidMController {

  private logger = new LogService();

  constructor(private readonly bidService: BidService) {
    this.logger.setContext(BidMController.name);
  }

  @MessagePattern({ cmd: 'ACCEPT_BID' })
  async acceptBid(@Payload() data: { bidId: string},) {

    return await this.bidService.acceptABid(data.bidId);
  }
}
