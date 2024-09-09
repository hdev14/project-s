export type EmailParams = {
  email: string;
  title: string;
  message: string;
}

export default interface EmailService {
  send(params: EmailParams): Promise<void>;
}