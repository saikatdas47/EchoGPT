import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ProvidersModule } from './providers/providers.module';
import { ChatModule } from './chat/chat.module';
import { SearchModule } from './search/search.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { UsageInterceptor } from './common/usage.interceptor';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, AuthModule, UsersModule, SubscriptionsModule, ProvidersModule, ChatModule, SearchModule, AdminModule, HealthModule],
  providers: [{ provide: APP_INTERCEPTOR, useClass: UsageInterceptor }],
})
export class AppModule {}
