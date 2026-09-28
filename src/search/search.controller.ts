import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../common/current-user.decorator";
import { SearchService } from "./search.service";
@ApiTags("Web Search")
@ApiBearerAuth()
@Controller("search")
export class SearchController {
  constructor(private s: SearchService) {}
  @Get() search(@CurrentUser() u: any, @Query("q") q: string) {
    return this.s.search(u.id, q);
  }
  @Get("history") history(@CurrentUser() u: any) {
    return this.s.history(u.id);
  }
  @Get("recent") recent(@CurrentUser() u: any) {
    return this.s.recent(u.id);
  }
  @Get("suggestions") suggest(@CurrentUser() u: any, @Query("q") q = "") {
    return this.s.suggestions(u.id, q);
  }
}
