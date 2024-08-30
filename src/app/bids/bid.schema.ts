import { Prop, Schema } from '@nestjs/mongoose';
import { connection, Document, Types, model, Model, PaginateModel, PaginateOptions } from 'mongoose';

import { CREATE_SCHEMA, customPropsDefault } from '@core/utils/models';
import { nanoid } from 'nanoid';

export enum BID_STATUS {
  PENDING = 'pending',
  DECLINED = 'declined',
  ACCEPTED = 'accepted'
}

interface BidModelInterface extends Model<Bid>, PaginateModel<Bid> {
}

/**
 * @class
 * @description typical mongoose schema definition stating the accurate data structure of each field in the document
 * @exports mongooseSchema
 * @extends Mongoose_DOCUMENT_INTERFACE
 */

@Schema(customPropsDefault())
export class Bid extends Document {
  @Prop({ default: () => nanoid(12), unique: true })
  readonly bidId: string;

  @Prop({ required: [true, 'Job Id Is Required!'] })
  readonly jobId: string;

  @Prop({ required: [true, 'Influencer Id Is Required!'] })
  readonly influencerId: string;

  @Prop({ required: [true, 'Cover Letter Is Required!'] })
  readonly coverLetter: string;

  @Prop({ required: [true, 'Price Is Required!'] })
  price: number;

  @Prop({ required: [true, 'Terms Is Required!'] })
  readonly terms: string[];

  @Prop({})
  readonly hired: boolean;

  @Prop({
    required: [function () {
      return this.hired;
    }, 'Hired Id is required.']
  })
  readonly hiredId: string;

  @Prop(
    {
      enum: {
        values: Object.values(BID_STATUS),
        message: '{{VALUE}} must be either "pending" or "declined" or "accepted"'
      },
      default: 'pending',
      required: [true, 'Status Is Required!'],
      lowercase: true
    })
  readonly status: string;

  @Prop({ required: false, default: false })
  readonly paymentStatus: boolean;

}

const BidModelName = Bid.name;
const BidSchema = CREATE_SCHEMA<Bid>(Bid);

BidSchema.index({ influencerId: 1, jobId: 1 }, { unique: true });
BidSchema.index({ influencerId: 1 });
BidSchema.index({ jobId: 1 });
BidSchema.index({ bidId: 1 });

BidSchema.virtual('job', {
  ref: "Job",
  localField: 'jobId',
  foreignField: 'jobId',
  justOne: true
});

BidSchema.virtual('influencer', {
  ref: "Influencer",
  localField: 'influencerId',
  foreignField: 'influencerId',
  justOne: true,
  options: {
    populate: [{ path: 'user' }]
  }
});

BidSchema.virtual('creator', {
  ref: "Job",
  localField: 'jobId',
  foreignField: 'jobId',
  justOne: true,
  options: {
    populate: [{ path: 'creator' }]
  }
});


const BidModel = { name: BidModelName, schema: BidSchema };

export { BidSchema, BidModelName, BidModel, BidModelInterface };

