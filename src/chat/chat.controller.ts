import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiProperty, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString, MinLength } from "class-validator";
import { CurrentUser } from "../common/current-user.decorator";
import { ChatService } from "./chat.service";
class PromptDto {
  @ApiProperty() @IsString() @MinLength(1) prompt: string;
  @IsOptional() @IsString() providerId?: string;
  @IsOptional() @IsString() conversationId?: string;
}
@ApiTags("Chat")
@ApiBearerAuth()
@Controller("chat")
export class ChatController {
  constructor(private s: ChatService) {}
  @Post() send(@CurrentUser() u: any, @Body() d: PromptDto) {
    return this.s.send(u.id, d.prompt, d.providerId, d.conversationId);
  }
  @Get("conversations") list(@CurrentUser() u: any) {
    return this.s.list(u.id);
  }
  @Get("conversations/:id") history(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.s.history(u.id, id);
  }
  @Delete("conversations/:id") remove(
    @CurrentUser() u: any,
    @Param("id") id: string,
  ) {
    return this.s.remove(u.id, id);
  }
}
