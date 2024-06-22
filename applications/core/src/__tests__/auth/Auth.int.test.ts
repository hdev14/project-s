import AuthModule from '@auth/infra/AuthModule';
import Application from 'src/Application';
import supertest from 'supertest';

describe('Auth integration tests', () => {
  const request = supertest(new Application({ modules: [new AuthModule()] }).server);

  it.todo('creates a new user');
});