import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Types, model, Model, PaginateModel } from 'mongoose';
import { NextFunction } from 'express';

import { CREATE_SCHEMA } from '@core/utils/models';

/**
 * @class
 * @description typical mongoose schema definition stating the accurate data structure of each field in the document
 * @exports mongooseSchema
 * @extends Mongoose_DOCUMENT_INTERFACE
 */

@Schema({ timestamps: true })
export class Review extends Document{ 
    @Prop({ required: [true, 'InfluencerId Is Required!'] })
    readonly influencerId: string;

    @Prop({ required: [true, 'creatorId Is Required!'] })
    readonly creatorId: string;

    @Prop({ required: [true, 'Jobid Is Required!'] })
    readonly jobId: string;

    @Prop({})
    readonly proof: [];
}

const ReviewModelName = Review.name;
const ReviewSchema = CREATE_SCHEMA<Review>(Review);

ReviewSchema.virtual('creator', {
  ref: "User",
  localField: 'creatorId',
  foreignField: 'creatorId',
  justOne: true
});

ReviewSchema.virtual('influencer', {
  ref: "User",
  localField: 'influencerId',
  foreignField: 'influencerId',
  justOne: true
});

ReviewSchema.virtual('job', {
  ref: "Job",
  localField: 'jobId',
  foreignField: 'jobId',
  justOne: true
});


const ReviewModel = { name: ReviewModelName, schema: ReviewSchema };

export { ReviewModel, ReviewModelName, ReviewSchema };