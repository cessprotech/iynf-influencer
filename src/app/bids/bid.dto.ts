import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi } from '@anatine/zod-openapi';
// import { ZodRequired } from '@app/common/helpers';
import { z } from 'zod';

const CreateBid = extendApi(
  z.object({
    jobId: z.string().min(1),
    coverLetter: z.string().min(20).optional(),
    price: z.number().min(0),
    terms: z.array(z.string().min(1)),

  }),
  {
    title: 'Create Bid',
    description: 'Create Bid'
  }
);

// const SaveContent = extendApi(
//   z.object({
//     title: z.string().min(3),
//     description: z.string().min(10),
//     url: z.string().min(1),
//     cover: z.string().min(1).optional(),
//   }),
//   {
//     title: 'Bid Save Content',
//     description: 'Bid Save Content'
//   }
// );

// const UploadContentUrl = extendApi(
//   z.object({
//     contentType: z.string().min(1),
//   }),
//   {
//     title: 'Content Upload Data',
//     description: 'Content Upload Data'
//   }
// );


export class CreateBidDto extends createZodDto(CreateBid.strict()) { };

export class UpdateBidDto extends createZodDto(CreateBid.pick({ coverLetter: true, price: true })) { }

// export class SaveContentDto extends createZodDto(SaveContent.strict()){};
// export class UploadContentUrlDto extends createZodDto(UploadContentUrl.strict()){};






