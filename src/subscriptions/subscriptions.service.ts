import { ForbiddenException, Injectable } from "@nestjs/common";
import { Plan } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
@Injectable()
export class SubscriptionsService {
  constructor(private prisma: PrismaService) {}
  private limits = { FREE: 50, PREMIUM: 2000 };
  async status(userId: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });
    const used = await this.prisma.apiUsageLog.count({
      where: {
        userId,
        OR: [
          { endpoint: { startsWith: "/api/v1/chat" } },
          { endpoint: { startsWith: "/api/v1/search" } },
        ],
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    });
    const plan = subscription?.plan || "FREE";
    return {
      subscription: { ...subscription, plan },
      limit: this.limits[plan],
      used,
      remaining: Math.max(0, this.limits[plan] - used),
    };
  }
  async change(userId: string, plan: Plan) {
    await this.prisma.subscription.updateMany({
      where: { userId, status: "ACTIVE" },
      data: { status: "CANCELED", endsAt: new Date() },
    });
    return this.prisma.subscription.create({ data: { userId, plan } });
  }
  async assertAvailable(userId: string) {
    const s = await this.status(userId);
    if (s.remaining <= 0)
      throw new ForbiddenException("Monthly request limit reached");
  }
}
