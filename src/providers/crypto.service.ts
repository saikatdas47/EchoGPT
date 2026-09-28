import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
@Injectable()
export class CryptoService {
  constructor(private config: ConfigService) {}
  private key() {
    const hex = this.config.getOrThrow<string>("PROVIDER_ENCRYPTION_KEY");
    if (!/^[a-f\d]{64}$/i.test(hex))
      throw new Error("PROVIDER_ENCRYPTION_KEY must be 64 hex characters");
    return Buffer.from(hex, "hex");
  }
  encrypt(text: string) {
    const iv = randomBytes(12),
      cipher = createCipheriv("aes-256-gcm", this.key(), iv);
    const encrypted = Buffer.concat([
      cipher.update(text, "utf8"),
      cipher.final(),
    ]);
    return [
      iv.toString("hex"),
      cipher.getAuthTag().toString("hex"),
      encrypted.toString("hex"),
    ].join(":");
  }
  decrypt(value: string) {
    const [iv, tag, data] = value.split(":");
    const d = createDecipheriv(
      "aes-256-gcm",
      this.key(),
      Buffer.from(iv, "hex"),
    );
    d.setAuthTag(Buffer.from(tag, "hex"));
    return Buffer.concat([
      d.update(Buffer.from(data, "hex")),
      d.final(),
    ]).toString("utf8");
  }
}
