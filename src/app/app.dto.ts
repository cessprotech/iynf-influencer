import { createZodDto } from '@anatine/zod-nestjs';
import { extendApi } from '@anatine/zod-openapi';
import { z } from 'zod';
import { ZodRequired } from './common/helpers';


const SocialSchema = z.object({
  name: z.string().min(1), // Platform name, e.g., Twitter, Instagram, etc.
  followers: z.number().min(0),
  url: z.string().url() // URL of the influencer's social profile
});
const CreateInfluencer = extendApi(
  z.object({
    bio: z.string().min(100),
    niche: z.array(z.string()).min(1),
    socials: z.array(SocialSchema)
  }),
  {
    title: 'Influencer Data',
    description: 'Influencer Data'
  }
);

const CreateJobRequest = extendApi(
  z.object({
    jobId: z.string().min(1),
    creatorId: z.string().min(1),
    creatorUserId: z.string().min(1),
    influencerId: z.string().min(1),
  }),
  {
    title: 'Send Request To An Influencer',
    description: 'Send Request To An Influencer'
  }
);

export class CreateJobRequestDto extends (createZodDto(CreateJobRequest) as ZodRequired<typeof CreateJobRequest>) { }

export class CreateInfluencerDto extends createZodDto(CreateInfluencer.strict()) { };

// export type CreateInfluencerDto = DeepRequired<CreateInfluencerDtoClass>

export class UpdateInfluencerDto extends createZodDto(CreateInfluencer.deepPartial()) { }

const UploadBannerUrl = extendApi(
  z.object({
    title: z.string().min(1),
    contentType: z.string().min(1),
  }),
  {
    title: 'Content Upload Data',
    description: 'Content Upload Data'
  }
);

export class UploadBannerUrlDto extends createZodDto(UploadBannerUrl.strict()) { };





