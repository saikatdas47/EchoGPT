import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailService {
  constructor(private readonly config: ConfigService) {}

  async sendVerificationOtp(email: string, otp: string) {
    const user = this.config.get<string>("EMAIL_USER");
    const pass = this.config.get<string>("EMAIL_APP_PASSWORD")?.replace(/\s/g, "");
    const rawName = this.config.get<string>("EMAIL_FROM_NAME", "EchoGPT");
    const fromName = rawName.replace(/[\r\n"]/g, "");

    if (!user || !pass) {
      throw new ServiceUnavailableException("Email service is not configured");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    try {
      await transporter.sendMail({
        from: `"${fromName}" <${user}>`,
        to: email,
        subject: "Your EchoGPT email verification code",
        text: `Your EchoGPT verification code is ${otp}. It expires soon and can be used only once.`,
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto"><h2>Verify your EchoGPT email</h2><p>Use this code:</p><p style="font-size:32px;font-weight:700;letter-spacing:6px">${otp}</p><p>This code expires soon and can be used only once.</p><p>If you did not request it, ignore this email.</p></div>`,
      });
    } catch {
      throw new ServiceUnavailableException("Verification email could not be sent");
    }
  }
}
