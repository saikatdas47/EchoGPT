import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsageInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const started = Date.now();
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    return next.handle().pipe(
      tap({
        finalize: () =>
          void this.prisma.apiUsageLog
            .create({
              data: {
                userId: req.user?.id,
                endpoint: (req.originalUrl || req.path).split("?")[0],
                method: req.method,
                statusCode: res.statusCode,
                responseTime: Date.now() - started,
              },
            })
            .catch(() => undefined),
      }),
    );
  }
}
