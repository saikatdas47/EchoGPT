import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { LoginDto, RegisterDto } from "./dto";
import { EmailService } from "./email.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}
  private hash(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
  private async tokens(user: { id: string; email: string; role: string }) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
        expiresIn: this.config.get("JWT_ACCESS_EXPIRES_IN", "15m") as any,
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, type: "refresh" },
      {
        secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
        expiresIn: this.config.get("JWT_REFRESH_EXPIRES_IN", "7d") as any,
      },
    );
    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hash(refreshToken),
        expiresAt: new Date(decoded.exp * 1000),
      },
    });
    return { accessToken, refreshToken };
  }
  async register(dto: RegisterDto) {
    if (
      await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      })
    )
      throw new ConflictException("Email is already registered");
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name,
        passwordHash: await bcrypt.hash(dto.password, 12),
        subscriptions: { create: { plan: "FREE" } },
      },
    });
    return {
      ...(await this.tokens(user)),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (
      !user?.isActive ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    )
      throw new UnauthorizedException("Invalid credentials");
    return {
      ...(await this.tokens(user)),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
  async refresh(raw: string) {
    try {
      const payload = await this.jwt.verifyAsync(raw, {
        secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
      });
      const stored = await this.prisma.refreshToken.findUnique({
        where: { tokenHash: this.hash(raw) },
      });
      if (!stored || stored.revokedAt || stored.expiresAt < new Date())
        throw new Error();
      await this.prisma.refreshToken.update({
        where: { id: stored.id },
        data: { revokedAt: new Date() },
      });
      const user = await this.prisma.user.findFirstOrThrow({
        where: { id: payload.sub, isActive: true },
      });
      return this.tokens(user);
    } catch {
      throw new UnauthorizedException("Invalid or expired refresh token");
    }
  }
  async logout(raw: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { message: "Logged out successfully" };
  }

  private otpHash(userId: string, otp: string) {
    return createHmac("sha256", this.config.getOrThrow("OTP_SECRET"))
      .update(`${userId}:${otp}`)
      .digest("hex");
  }

  private otpMatches(storedHash: string, candidateHash: string) {
    const stored = Buffer.from(storedHash, "hex");
    const candidate = Buffer.from(candidateHash, "hex");
    return stored.length === candidate.length && timingSafeEqual(stored, candidate);
  }

  async sendEmailOtp(rawEmail: string) {
    const email = rawEmail.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    const message = "If the account exists and is not verified, a code was sent.";

    // A generic response prevents attackers from discovering registered emails.
    if (!user || user.emailVerified) return { message };

    const resendSeconds = Number(this.config.get("OTP_RESEND_SECONDS", 60));
    const latest = await this.prisma.emailVerificationOtp.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (
      latest &&
      Date.now() - latest.createdAt.getTime() < resendSeconds * 1000
    ) {
      throw new HttpException(
        `Please wait ${resendSeconds} seconds before requesting another code`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const otp = String(randomInt(100000, 1000000));
    const expiryMinutes = Number(this.config.get("OTP_EXPIRES_MINUTES", 5));
    const record = await this.prisma.emailVerificationOtp.create({
      data: {
        userId: user.id,
        otpHash: this.otpHash(user.id, otp),
        expiresAt: new Date(Date.now() + expiryMinutes * 60_000),
      },
    });

    try {
      await this.emailService.sendVerificationOtp(email, otp);
    } catch (error) {
      await this.prisma.emailVerificationOtp.delete({ where: { id: record.id } });
      throw error;
    }

    await this.prisma.emailVerificationOtp.updateMany({
      where: { userId: user.id, usedAt: null, id: { not: record.id } },
      data: { usedAt: new Date() },
    });
    return { message };
  }

  async verifyEmailOtp(rawEmail: string, otp: string) {
    const email = rawEmail.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new BadRequestException("Invalid or expired verification code");
    if (user.emailVerified) return { verified: true, message: "Email is already verified" };

    const record = await this.prisma.emailVerificationOtp.findFirst({
      where: { userId: user.id, usedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await this.prisma.emailVerificationOtp.update({
          where: { id: record.id },
          data: { usedAt: new Date() },
        });
      }
      throw new BadRequestException("Invalid or expired verification code");
    }

    const maxAttempts = Number(this.config.get("OTP_MAX_ATTEMPTS", 5));
    if (record.attempts >= maxAttempts) {
      throw new HttpException(
        "Too many incorrect attempts; request a new code",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const matches = this.otpMatches(record.otpHash, this.otpHash(user.id, otp));
    if (!matches) {
      const attempts = record.attempts + 1;
      await this.prisma.emailVerificationOtp.update({
        where: { id: record.id },
        data: { attempts, usedAt: attempts >= maxAttempts ? new Date() : null },
      });
      if (attempts >= maxAttempts) {
        throw new HttpException(
          "Too many incorrect attempts; request a new code",
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      throw new BadRequestException("Invalid or expired verification code");
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerificationOtp.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);
    return { verified: true, message: "Email verified successfully" };
  }
}
