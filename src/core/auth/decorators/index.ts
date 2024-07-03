import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthenticationGuard } from '../authentication.guard';

export const PUBLIC_KEY = 'IS_PUBLIC';
export const IAM = 'INFLUENCER';



// eslint-disable-next-line @typescript-eslint/ban-types

export const Protect = () => {
  return applyDecorators(
    UseGuards(AuthenticationGuard),
  );
};

export const Public = () => SetMetadata(PUBLIC_KEY, true);
export const Iam = () => SetMetadata(IAM, true);
