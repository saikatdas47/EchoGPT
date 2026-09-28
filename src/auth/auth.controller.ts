import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Public } from "../common/public.decorator";
import { AuthService } from "./auth.service";
import { LoginDto, RefreshDto, RegisterDto } from "./dto";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a user" })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }
  @Public() @Post("login") @ApiOperation({ summary: "Login" }) login(
    @Body() dto: LoginDto,
  ) {
    return this.auth.login(dto);
  }
  @Public()
  @Post("refresh")
  @ApiOperation({ summary: "Rotate refresh token" })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }
  @ApiBearerAuth()
  @Post("logout")
  @ApiOperation({ summary: "Revoke refresh token" })
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }
}
