import EmailService, { EmailParams } from "@auth/app/EmailService";

export default class SMTPService implements EmailService {
  send(params: EmailParams): Promise<void> {
    throw new Error("Method not implemented.");
  }
}