import EmailService, { EmailParams } from "@auth/app/EmailService";
import { injectable } from "inversify";
import nodemailer from 'nodemailer';
import 'reflect-metadata';


@injectable()
export default class SMTPService implements EmailService {
  #smtp_client: nodemailer.Transporter;

  constructor() {
    this.#smtp_client = nodemailer.createTransport({
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASSWORD!,
      },
      port: parseInt(process.env.SMPT_PORT!, 10),
      host: process.env.SMTP_HOST!,
      secure: process.env.NODE_ENV === 'production',
    });
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