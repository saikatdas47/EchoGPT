import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Public } from "../common/public.decorator";
import { AuthService } from "./auth.service";
import {
  EmailOtpRequestDto,
  EmailOtpVerifyDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
} from "./dto";

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
  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login" })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }
  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rotate refresh token" })
  refresh(@Body() dto: RefreshDto) {
    return this.auth.refresh(dto.refreshToken);
  }
  @ApiBearerAuth()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Revoke refresh token" })
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Public()
  @Post("email/send-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Send a six-digit email verification code" })
  @ApiResponse({ status: 200, description: "Generic anti-enumeration response" })
  @ApiResponse({ status: 429, description: "Resend cooldown is active" })
  sendEmailOtp(@Body() dto: EmailOtpRequestDto) {
    return this.auth.sendEmailOtp(dto.email);
  }

  @Public()
  @Post("email/resend-otp")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resend an email verification code" })
  resendEmailOtp(@Body() dto: EmailOtpRequestDto) {
    return this.auth.sendEmailOtp(dto.email);
  }

  @Public()
  @Post("email/verify")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Verify email with the six-digit code" })
  @ApiResponse({ status: 200, description: "Email verified" })
  @ApiResponse({ status: 400, description: "Code is invalid or expired" })
  verifyEmailOtp(@Body() dto: EmailOtpVerifyDto) {
    return this.auth.verifyEmailOtp(dto.email, dto.otp);
  }
}
