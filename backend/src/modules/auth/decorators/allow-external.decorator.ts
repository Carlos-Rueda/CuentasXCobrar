import { SetMetadata } from '@nestjs/common';

export const AllowExternal = () => SetMetadata('isExternalAllowed', true);
