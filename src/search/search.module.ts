import { Module } from "@nestjs/common";
import { SubscriptionsModule } from "../subscriptions/subscriptions.module";
import { SearchController } from "./search.controller";
import { SearchService } from "./search.service";
@Module({
  imports: [SubscriptionsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
