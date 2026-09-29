import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "./common/public.decorator";

@ApiTags("API")
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiOperation({ summary: "Get API information" })
  info() {
    return {
      name: "EchoGPT Backend API",
      status: "running",
      version: "1.0.0",
      documentation: "/docs",
      health: "/api/v1/health",
    };
  }
}
