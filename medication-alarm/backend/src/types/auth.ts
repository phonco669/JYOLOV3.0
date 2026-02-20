import { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
