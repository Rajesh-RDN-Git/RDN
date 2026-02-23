import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

interface AuthenticatedUser {
  id: string;
  role: string;
  societyId?: string;
}

@Injectable()
export class SocietyScopeMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = (req as Request & { user?: AuthenticatedUser }).user;

    // Skip for unauthenticated requests (will be caught by auth guard)
    // Skip for SUPER_ADMIN (full access) and non-society-scoped roles
    if (
      !user ||
      user.role === 'SUPER_ADMIN' ||
      user.role === 'OWNER' ||
      user.role === 'BUYER_TENANT'
    ) {
      return next();
    }

    // RWA_ADMIN and DEALER must only access their own society's resources
    if (user.role === 'RWA_ADMIN' || user.role === 'DEALER') {
      const societyId = req.params.societyId || req.body?.societyId || req.query?.societyId;

      if (societyId && user.societyId && societyId !== user.societyId) {
        throw new ForbiddenException('You can only access resources within your own society');
      }
    }

    next();
  }
}
