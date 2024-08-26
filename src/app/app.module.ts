import { Module } from '@nestjs/common';
// import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LogModule } from '@core/logger';
import { MessageModule } from '@core/modules/message';
// import { MiddlewareModule } from '@libs/modules/middleware';
import { EventEmitModule } from '@core/modules/event-emitter';

import { CONFIG_VALIDATORS } from '@core/config';
import { APP_ENV } from './app.config';
import { DB_CONNECTION, MODEL_INJECT } from '@core/modules/database';
import { ShutdownService } from './power.service';
// import { CachingModule } from '@libs/modules/caching/caching.module';
import { MicroServicesConfig } from './config.service';
import { InfluencerModel, ReviewModel } from './app.schema';
import { ExternalModels } from './schema/externals.schema';
import { MeController } from './me.controller';
import { SentryInterceptor } from '@core/common/interceptors/sentry.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppMSController } from './app.m.controller';
import { CreatorMService } from './mservices/creator.m.service';
import { BidMController } from './bids/bid.m.controller';
import { BidController } from './bids/bid.controller';
import { BidModel } from './bids/bid.schema';
import { BidService } from './bids/bid.service';
import { HiredModel } from './bids/hired.schema';
import { JobRequestService } from './services/job-request.service';
import { JobRequestModel } from './schema/request.schema';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    DB_CONNECTION,

    MODEL_INJECT([ InfluencerModel, ReviewModel, BidModel, HiredModel, JobRequestModel, ...ExternalModels ]),

    LogModule.forRoot(),

    ConfigModule.forRoot({
      load: [APP_ENV],
      envFilePath: process.env.NODE_ENV === 'production' ? '.env' : 'dev.env',
      validationSchema: CONFIG_VALIDATORS,
      cache: true,
      isGlobal: true,
    }),

    MicroServicesConfig(),

    // MiddlewareModule,

    MessageModule,    
    //features
    EventEmitModule,

  ],

  controllers: [AppController, MeController, AppMSController, BidController, BidMController, AdminController],

  providers: [AppService, ShutdownService, CreatorMService, BidService, AdminService, JobRequestService,
    {
      provide: APP_INTERCEPTOR,
      useClass: SentryInterceptor
    }
  ],
})
export class AppModule {}
