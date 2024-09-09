import EmailService, { EmailParams } from "@global/app/EmailService";
import { injectable } from "inversify";
import nodemailer from 'nodemailer';
import 'reflect-metadata';


@injectable()
export default class SMTPService implements EmailService {
  #smtp_client: nodemailer.Transporter;

  constructor() {
    const config = {
      port: parseInt(process.env.SMTP_PORT!, 10),
      host: process.env.SMTP_HOST!,
    };

    if (process.env.NODE_ENV === 'production') {
      Object.assign(config, {
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASSWORD!,
        },
        secure: true,
      });
    }

    this.#smtp_client = nodemailer.createTransport(config);
  }

  async send(params: EmailParams): Promise<void> {
    await this.#smtp_client.sendMail({
      text: params.message,
      from: process.env.DEFAULT_EMAIL!,
      to: params.email,
      subject: params.title,
    });
  }
}
