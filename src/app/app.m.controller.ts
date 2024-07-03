import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags } from '@nestjs/swagger';
import { TAGS } from '@app/common/constants';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { LogService } from '@core/logger';
import { MSController } from './common/helpers';
import { CreateJobRequestDto } from './app.dto';
import { JobRequestService } from './services/job-request.service';


@ApiTags(TAGS.DEFAULT)
@Controller()
@MSController()
// @UsePipes(ZodValidationPipe)
export class AppMSController {

  private logger = new LogService();

  constructor(
    private readonly appService: AppService,
    private readonly jobRequestService: JobRequestService
    ) {
    this.logger.setContext(AppMSController.name);
  }

  @MessagePattern({ cmd: 'SUSPENDED_INFLUENCER' })
  async suspendedInfluencer(@Payload() data: { influencerId: string},) {

    return await this.appService.iamSuspended(data.influencerId);
  }
  
  @MessagePattern({ cmd: 'CREATE_JOB_REQUEST' })
  async createJobRequest(@Payload() data: CreateJobRequestDto,) {

    return await this.jobRequestService.createJobRequest(data);
  }
}
