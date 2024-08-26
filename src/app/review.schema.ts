import { Prop, Schema } from '@nestjs/mongoose';
import { Document, Types, model, Model, PaginateModel } from 'mongoose';
import { NextFunction } from 'express';

import { CREATE_SCHEMA, customPropsDefault } from '@core/utils/models';


/**
 * @class
 * @description typical mongoose schema definition stating the accurate data structure of each field in the document
 * @exports mongooseSchema
 * @extends Mongoose_DOCUMENT_INTERFACE
 */

@Schema({ timestamps: true })
export class Review extends Document{ 
    @Prop({ required: [true, 'InfluencerId Is Required!'] })
    influencerId: string;

    @Prop({ required: [true, 'creatorId Is Required!'] })
    creatorId: string;

    @Prop({ required: [true, 'Jobid Is Required!'] })
    jobId: string;

    @Prop({})
    proof: [];
}

const ReviewModelName = Review.name;
const ReviewSchema = CREATE_SCHEMA<Review>(Review);

ReviewSchema.virtual('influencer', {
    ref: "Influencer",
    localField: 'influencerId',
    foreignField: 'influencerId',
    justOne: true,
    options: {
      populate: [{ path: 'user' }]
    }
});

ReviewSchema.virtual('creator', {
    ref: "Creator",
    localField: 'creatorId',
    foreignField: 'creatorId',
    justOne: true,
    options: {
      populate: [{ path: 'user' }]
    }
});
  
  
// ReviewSchema.virtual('creator', {
//     ref: "Creator",
//     localField: 'creatorId',
//     foreignField: 'creatorId',
//     justOne: true,
// });
  

ReviewSchema.virtual('job', {
  ref: "Job",
  localField: 'jobId',
  foreignField: 'jobId',
  justOne: true
});


const ReviewModel = { name: ReviewModelName, schema: ReviewSchema };

export { ReviewModel, ReviewModelName, ReviewSchema };