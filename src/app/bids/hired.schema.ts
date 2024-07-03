import { Prop, Schema } from '@nestjs/mongoose';
import { connection, Document, Types, model, Model, PaginateModel, PaginateOptions } from 'mongoose';

import { CREATE_SCHEMA, customPropsDefault } from '@core/utils/models';
import { nanoid } from 'nanoid';

export enum HIRED_STATUS {
  PROGRESS = 'progressing',
  COMPLETED = 'completed',
}


interface HiredModelInterface extends Model<Hired>, PaginateModel<Hired> {
}

/**
 * @class
 * @description typical mongoose schema definition stating the accurate data structure of each field in the document
 * @exports mongooseSchema
 * @extends Mongoose_DOCUMENT_INTERFACE
 */

@Schema(customPropsDefault())
export class Hired extends Document {
  @Prop()
  readonly hiredId: string;

  @Prop()
  readonly jobId: string;
  
  @Prop()
  readonly creatorId: string;

  @Prop()
  readonly influencerId: string;

  @Prop()
  readonly bidId: string;

  @Prop()
  price: number;
  
  @Prop()
  deadline: Date;
  
  @Prop()
  readonly creatorStatus: boolean;
  
  @Prop(
    { 
      default: false,
    })
  readonly influencerStatus: boolean;
}

const HiredModelName = Hired.name;
const HiredSchema = CREATE_SCHEMA<Hired>(Hired);


HiredSchema.index({ creatorId: 1});
HiredSchema.index({ influencerId: 1});
HiredSchema.index({ jobId: 1});

HiredSchema.virtual('influencer', {
  ref: "Influencer",
  localField: 'influencerId',
  foreignField: 'influencerId',
  justOne: true,
  options: {
    populate: [{ path: 'user' }]
  }
});

HiredSchema.virtual('creator', {
  ref: "Creator",
  localField: 'creatorId',
  foreignField: 'creatorId',
  justOne: true,
  options: {
    populate: [{ path: 'user' }]
  }
});

HiredSchema.virtual('job', {
  ref: "Job",
  localField: 'jobId',
  foreignField: 'jobId',
  justOne: true
});

HiredSchema.virtual('bid', {
  ref: "Bid",
  localField: 'bidId',
  foreignField: 'bidId',
  justOne: true
});


const HiredModel = { name: HiredModelName, schema: HiredSchema };

export { HiredSchema, HiredModelName, HiredModel, HiredModelInterface };

