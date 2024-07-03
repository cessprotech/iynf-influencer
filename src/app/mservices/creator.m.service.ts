import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { LogService, Logger } from '@core/logger';
import { firstValueFrom } from 'rxjs';
import { ClientProxy } from '@nestjs/microservices';
import { APP_CONFIG } from '@app/app.constants';
import { MSResponse } from '@core/common/interfaces';
// import { CachingService } from '@libs/modules/caching';

@Injectable()
export class CreatorMService {
  @Logger(CreatorMService.name)private logger = new LogService();

  constructor(
    
    @Inject(APP_CONFIG.CREATOR_SERVICE) private readonly creatorClient: ClientProxy,
  ) {}

  async getJob(jobId: string) {

    const response: MSResponse = await firstValueFrom(
      this.creatorClient.send({ cmd: 'GET_JOB' }, { jobId }),
    );

    if (!response.status) {
      throw new BadRequestException(response.error);
    }

    return response.data;
  }
  
}
