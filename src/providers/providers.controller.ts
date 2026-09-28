import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiTags } from "@nestjs/swagger";
import { ProviderType } from "@prisma/client";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";
import { CurrentUser } from "../common/current-user.decorator";
import { ProvidersService } from "./providers.service";
class ProviderDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: ProviderType }) @IsEnum(ProviderType) type: ProviderType;
  @ApiProperty() @IsString() model: string;
  @ApiProperty() @IsString() apiKey: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
class ProviderPatchDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() model?: string;
  @IsOptional() @IsString() apiKey?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsBoolean() isEnabled?: boolean;
}
@ApiTags("AI Providers")
@ApiBearerAuth()
@Controller("providers")
export class ProvidersController {
  constructor(private s: ProvidersService) {}
  @Get() list(@CurrentUser() u: any) {
    return this.s.list(u.id);
  }
  @Post() create(@CurrentUser() u: any, @Body() d: ProviderDto) {
    return this.s.create(u.id, d);
  }
  @Patch(":id") update(
    @CurrentUser() u: any,
    @Param("id") id: string,
    @Body() d: ProviderPatchDto,
  ) {
    return this.s.update(u.id, id, d);
  }
  @Delete(":id") remove(@CurrentUser() u: any, @Param("id") id: string) {
    return this.s.remove(u.id, id);
  }
  @Get(":id/health") health(@CurrentUser() u: any, @Param("id") id: string) {
    return this.s.health(u.id, id);
  }
}
