/* commented because of "Must use import to load ES Module: /home/hdev/projects/project_s/node_modules/emailjs/email.js"
import SMTPService from "@auth/infra/SMTPService";
import { faker } from '@faker-js/faker/locale/pt_BR';
import * as emailjs from 'emailjs';

const send_mock = jest.fn();

jest.spyOn(emailjs, 'SMTPClient').mockImplementation(() => ({
  sendAsync: send_mock,
}) as unknown as emailjs.SMTPClient);

const OLD_ENV = process.env;

beforeAll(() => {
  process.env = Object.assign({}, OLD_ENV, {
    DEFAULT_EMAIL: 'test@email.com',
    SMTP_USER: 'user',
    SMTP_PASSWORD: 'password',
    SMTP_HOST: 'smtp.your-email.com',
  });
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe.skip('SMTPService unit tests', () => {
  const email_service = new SMTPService();

  beforeEach(() => {
    send_mock.mockReset();
  });

  it('should send an email for the correct address', async () => {
    const params = {
      email: faker.internet.email(),
      message: faker.lorem.lines(),
      title: faker.string.sample(),
    };

    await email_service.send(params);

    expect(send_mock).toHaveBeenCalledWith({
      text: params.message,
      from: 'test@email.com',
      to: params.email,
      subject: params.title,
    })
  });
});
*/

it.todo('SMTPService');