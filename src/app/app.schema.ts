import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Types, model, Model, PaginateModel } from 'mongoose';
import { NextFunction } from 'express';

import { CREATE_SCHEMA, customPropsDefault } from '@core/utils/models';
import { nanoid } from 'nanoid';

interface InfluencerModelInterface extends Model<Influencer>, PaginateModel<Influencer> {
}

export class Social extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  followers: string;
  
  @Prop({ required: true })
  url: string;
}

/**
 * @class
 * @description typical mongoose schema definition stating the accurate data structure of each field in the document
 * @exports mongooseSchema
 * @extends Mongoose_DOCUMENT_INTERFACE
 */

@Schema(customPropsDefault([]))
export class Influencer extends Document {

  @Prop({ default: () => nanoid(12), unique: true })
  readonly influencerId: string;

  @Prop({ required: [true, 'User Is Required!'], unique: true })
  readonly userId: string;

  @Prop({ required: [true, 'Niche Is Required!'] })
  readonly niche: string[];

  @Prop({ required: [true, 'Bio Is Required!'] })
  readonly bio: string;
  
  @Prop({
    default: true
  })
  readonly completed: boolean;
  
  @Prop({})
  readonly socials: Social[];

  @Prop({
    default: false
  })
  readonly suspended: boolean;

  @Prop({
    default: 0
  })
  readonly balance: number;
}

const InfluencerModelName = Influencer.name;
const InfluencerSchema = CREATE_SCHEMA<Influencer>(Influencer);

InfluencerSchema.index({ userId: 1, title: 1 }, { unique: true });

InfluencerSchema.virtual('user', {
  ref: "User",
  localField: 'userId',
  foreignField: 'userId',
  justOne: true
});


InfluencerSchema.pre('save', async function (next: NextFunction) {
  if (this.isNew) {}

  next();
});

InfluencerSchema.pre(/update|updateOne|findOneAndUpdate|findByIdAndUpdate/, async function () {

  const influencer: any = this

  const query = influencer._conditions;

  const updateFields = influencer._update;

});


const InfluencerModel = { name: InfluencerModelName, schema: InfluencerSchema };


export { InfluencerSchema, InfluencerModelName, InfluencerModel, InfluencerModelInterface };