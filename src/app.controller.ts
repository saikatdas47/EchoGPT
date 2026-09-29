import { Controller, Get, Res } from "@nestjs/common";
import { ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { Public } from "./common/public.decorator";

@ApiTags("API")
@Controller()
export class AppController {
  @Public()
  @Get()
  @ApiExcludeEndpoint()
  home(@Res() response: Response) {
    return response.redirect("/docs");
  }
}
