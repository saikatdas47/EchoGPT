import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from "class-validator";

export class RegisterDto {
  @ApiProperty({ example: "user@example.com" }) @IsEmail() email: string;
  @ApiProperty({ example: "StrongPass123!" })
  @IsString()
  @MinLength(8)
  password: string;
  @ApiProperty({ example: "Saikat Das", required: false })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;
}
export class LoginDto {
  @ApiProperty({ example: "user@example.com" }) @IsEmail() email: string;
  @ApiProperty({ example: "StrongPass123!" }) @IsString() password: string;
}
export class RefreshDto {
  @ApiProperty() @IsString() refreshToken: string;
}

export class EmailOtpRequestDto {
  @ApiProperty({ example: "user@example.com" })
  @IsEmail()
  email: string;
}

export class EmailOtpVerifyDto extends EmailOtpRequestDto {
  @ApiProperty({ example: "483921", description: "Six-digit code sent by email" })
  @IsString()
  @Matches(/^\d{6}$/, { message: "otp must be a six-digit code" })
  otp: string;
}
