import EmailService, { EmailParams } from "@auth/app/EmailService";
import { SMTPClient } from "emailjs";

export default class SMTPService implements EmailService {
  #smtp_client: SMTPClient;

  constructor() {
    this.#smtp_client = new SMTPClient({
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
      host: process.env.SMTP_HOST,
      ssl: process.env.NODE_ENV === 'production',
    });
  }

  async send(params: EmailParams): Promise<void> {
    await this.#smtp_client.sendAsync({
      text: params.message,
      from: process.env.DEFAULT_EMAIL!,
      to: params.email,
      subject: params.title,
    });
  }
}