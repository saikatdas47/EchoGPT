import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Role } from "@prisma/client";
import { Roles } from "../common/roles.decorator";
import { AdminService } from "./admin.service";
@ApiTags("Admin")
@ApiBearerAuth()
@Roles(Role.ADMIN)
@Controller("admin")
export class AdminController {
  constructor(private s: AdminService) {}
  @Get("dashboard") dashboard() {
    return this.s.dashboard();
  }
  @Get("users") users() {
    return this.s.users();
  }
  @Get("subscriptions") subscriptions() {
    return this.s.subscriptions();
  }
  @Get("providers") providers() {
    return this.s.providers();
  }
  @Get("usage") usage() {
    return this.s.usage();
  }
  @Get("logs") logs() {
    return this.s.logs();
  }
}
