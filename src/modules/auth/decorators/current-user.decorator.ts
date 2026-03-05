import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface User {
  userId?: string;
  email?: string;
  name?: string;
  username?: string;
  groups?: string[];
  tokenUse?: string;
  [key: string]: unknown;
}

interface RequestWithUser {
  user?: User;
}

export const CurrentUser = createParamDecorator((data: string | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();

  const user = request.user;

  // If a specific property is requested, return that property

  return data && user ? user[data] : user;
});
