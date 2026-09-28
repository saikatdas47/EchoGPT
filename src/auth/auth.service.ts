import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService, private readonly config: ConfigService) {}
  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
  private async tokens(user: { id: string; email: string; role: string }) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role }, { secret: this.config.getOrThrow('JWT_ACCESS_SECRET'), expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m') as any });
    const refreshToken = await this.jwt.signAsync({ sub: user.id, type: 'refresh' }, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET'), expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d') as any });
    const decoded = this.jwt.decode(refreshToken) as { exp: number };
    await this.prisma.refreshToken.create({ data: { userId: user.id, tokenHash: this.hash(refreshToken), expiresAt: new Date(decoded.exp * 1000) } });
    return { accessToken, refreshToken };
  }
  async register(dto: RegisterDto) {
    if (await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } })) throw new ConflictException('Email is already registered');
    const user = await this.prisma.user.create({ data: { email: dto.email.toLowerCase(), name: dto.name, passwordHash: await bcrypt.hash(dto.password, 12), subscriptions: { create: { plan: 'FREE' } } } });
    return { ...(await this.tokens(user)), user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user?.isActive || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    return { ...(await this.tokens(user)), user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  }
  async refresh(raw: string) {
    try {
      const payload = await this.jwt.verifyAsync(raw, { secret: this.config.getOrThrow('JWT_REFRESH_SECRET') });
      const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash: this.hash(raw) } });
      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw new Error();
      await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
      const user = await this.prisma.user.findFirstOrThrow({ where: { id: payload.sub, isActive: true } });
      return this.tokens(user);
    } catch { throw new UnauthorizedException('Invalid or expired refresh token'); }
  }
  async logout(raw: string) { await this.prisma.refreshToken.updateMany({ where: { tokenHash: this.hash(raw), revokedAt: null }, data: { revokedAt: new Date() } }); return { message: 'Logged out successfully' }; }
}
