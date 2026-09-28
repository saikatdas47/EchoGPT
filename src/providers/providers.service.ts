import { Injectable, NotFoundException } from "@nestjs/common";
import { ProviderType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CryptoService } from "./crypto.service";
export interface ProviderInput {
  name: string;
  type: ProviderType;
  model: string;
  apiKey: string;
  isDefault?: boolean;
}
@Injectable()
export class ProvidersService {
  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}
  list(userId: string) {
    return this.prisma.aiProvider.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        model: true,
        isEnabled: true,
        isDefault: true,
        createdAt: true,
      },
    });
  }
  async create(userId: string, d: ProviderInput) {
    if (d.isDefault)
      await this.prisma.aiProvider.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    return this.prisma.aiProvider.create({
      data: {
        userId,
        name: d.name,
        type: d.type,
        model: d.model,
        encryptedApiKey: this.crypto.encrypt(d.apiKey),
        isDefault: d.isDefault,
      },
    });
  }
  async update(
    userId: string,
    id: string,
    d: Partial<ProviderInput> & { isEnabled?: boolean },
  ) {
    const found = await this.prisma.aiProvider.findFirst({
      where: { id, userId },
    });
    if (!found) throw new NotFoundException();
    if (d.isDefault)
      await this.prisma.aiProvider.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    const { apiKey, ...rest } = d;
    return this.prisma.aiProvider.update({
      where: { id },
      data: {
        ...rest,
        ...(apiKey ? { encryptedApiKey: this.crypto.encrypt(apiKey) } : {}),
      },
    });
  }
  async remove(userId: string, id: string) {
    const r = await this.prisma.aiProvider.deleteMany({
      where: { id, userId },
    });
    if (!r.count) throw new NotFoundException();
    return { message: "Provider deleted" };
  }
  async usable(userId: string, id?: string) {
    const p =
      (await this.prisma.aiProvider.findFirst({
        where: {
          userId,
          isEnabled: true,
          ...(id ? { id } : { isDefault: true }),
        },
      })) ||
      (await this.prisma.aiProvider.findFirst({
        where: { userId, isEnabled: true },
      }));
    if (!p) throw new NotFoundException("No enabled AI provider");
    return { ...p, apiKey: this.crypto.decrypt(p.encryptedApiKey) };
  }
  async health(userId: string, id: string) {
    const p = await this.usable(userId, id);
    return { provider: p.name, status: "configured", checkedAt: new Date() };
  }
}
