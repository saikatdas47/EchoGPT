import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "./email.service";
describe("AuthService", () => {
  it("is defined", async () => {
    const m = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        ConfigService,
        { provide: PrismaService, useValue: {} },
        { provide: EmailService, useValue: { sendVerificationOtp: jest.fn() } },
      ],
    }).compile();
    expect(m.get(AuthService)).toBeDefined();
  });
});
