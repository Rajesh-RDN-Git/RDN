import type { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs';
import { PrismaService } from '../../database/prisma.service';
import { scrubPii } from '../utils/pii-scrub';

const AUDITED_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, params } = request;

    if (!AUDITED_METHODS.has(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap((response) => {
        const userId = request.user?.id;
        if (!userId) return;

        // Extract entity type from URL path (e.g., /v1/leads -> leads)
        const pathParts = url.split('/').filter(Boolean);
        const entityType =
          pathParts.find((p: string) => p !== 'v1' && !p.match(/^[0-9a-f-]{36}$/i)) || 'unknown';

        const entityId = params?.id || response?.id || '00000000-0000-0000-0000-000000000000';

        // Non-blocking write to audit log
        this.prisma.auditLog
          .create({
            data: {
              userId,
              action: `${method} ${url}`,
              entityType,
              entityId,
              changes: scrubPii(body) || {},
              ipAddress: request.ip || request.headers['x-forwarded-for'] || null,
            },
          })
          .catch((err) => {
            this.logger.warn(`Failed to write audit log: ${err.message}`);
          });
      }),
    );
  }
}
