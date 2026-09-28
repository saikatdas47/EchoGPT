import { Injectable, NotFoundException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  profile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  }
  update(id: string, name?: string) {
    return this.prisma.user.update({
      where: { id },
      data: { name },
      select: { id: true, email: true, name: true, role: true },
    });
  }
  async password(id: string, current: string, next: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || !(await bcrypt.compare(current, user.passwordHash)))
      throw new NotFoundException("Current password is incorrect");
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { passwordHash: await bcrypt.hash(next, 12) },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
    return { message: "Password changed" };
  }
  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { message: "Account deleted" };
  }
}
