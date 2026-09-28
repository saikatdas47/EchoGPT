import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
describe("AuthService", () => {
  it("is defined", async () => {
    const m = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        ConfigService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
    expect(m.get(AuthService)).toBeDefined();
  });
});
