import { Module } from "@nestjs/common";
import { CryptoService } from "./crypto.service";
import { ProvidersController } from "./providers.controller";
import { ProvidersService } from "./providers.service";
@Module({
  controllers: [ProvidersController],
  providers: [ProvidersService, CryptoService],
  exports: [ProvidersService],
})
export class ProvidersModule {}
