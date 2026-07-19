import { SetMetadata } from '@nestjs/common';

export const RequireFunction = (funcion: string) => SetMetadata('requireFunction', funcion);
