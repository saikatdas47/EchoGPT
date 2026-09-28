import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../common/public.decorator";
import { PrismaService } from "../prisma/prisma.service";
@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private p: PrismaService) {}
  @Public() @Get() async health() {
    await this.p.$queryRaw`SELECT 1`;
    return {
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    };
  }
}
