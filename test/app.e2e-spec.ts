import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request = require("supertest");
import { AppModule } from "../src/app.module";
import { EmailService } from "../src/auth/email.service";
import { PrismaService } from "../src/prisma/prisma.service";

jest.setTimeout(30_000);

describe("EchoGPT API (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testEmail: string;
  let deliveredOtp = "";

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue({
        sendVerificationOtp: async (_email: string, otp: string) => {
          deliveredOtp = otp;
        },
      })
      .compile();

    app = module.createNestApplication();
    prisma = module.get(PrismaService);
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(async () => {
    if (testEmail) {
      await prisma.user.deleteMany({ where: { email: testEmail } });
    }
  });

  it("runs the health and authentication lifecycle", async () => {
    const email = `e2e-${Date.now()}@example.com`;
    testEmail = email;
    const password = "E2eStrong123!";

    await request(app.getHttpServer())
      .get("/api/v1/health")
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe("ok");
        expect(body.database).toBe("connected");
      });

    const registered = await request(app.getHttpServer())
      .post("/api/v1/auth/register")
      .send({ email, password, name: "E2E Test User" })
      .expect(201);

    expect(registered.body.accessToken).toBeDefined();
    expect(registered.body.refreshToken).toBeDefined();

    await request(app.getHttpServer())
      .post("/api/v1/auth/email/send-otp")
      .send({ email })
      .expect(200);

    expect(deliveredOtp).toMatch(/^\d{6}$/);

    await request(app.getHttpServer())
      .post("/api/v1/auth/email/verify")
      .send({ email, otp: deliveredOtp })
      .expect(200)
      .expect(({ body }) => expect(body.verified).toBe(true));

    await request(app.getHttpServer())
      .get("/api/v1/users/me")
      .set("Authorization", `Bearer ${registered.body.accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.email).toBe(email);
        expect(body.emailVerified).toBe(true);
      });

    const refreshed = await request(app.getHttpServer())
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: registered.body.refreshToken })
      .expect(200);

    await request(app.getHttpServer())
      .delete("/api/v1/users/me")
      .set("Authorization", `Bearer ${refreshed.body.accessToken}`)
      .expect(200);
  });
});
