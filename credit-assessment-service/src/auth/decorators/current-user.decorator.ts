import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
