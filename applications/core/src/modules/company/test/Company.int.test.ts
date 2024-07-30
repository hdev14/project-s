import AuthModule from '@auth/infra/AuthModule';
import CatalogModule from '@catalog/infra/CatalogModule';
import CompanyModule from '@company/infra/CompanyModule';
import SharedModule from '@shared/infra/SharedModule';
import Application from 'src/Application';

describe('Company integration tests', () => {
  const application = new Application({
    modules: [
      new SharedModule(),
      new AuthModule(),
      new CatalogModule(),
      new CompanyModule(),
    ]
  });

  beforeEach(async () => { });

  afterEach(async () => { });

  it.todo('POST: /api/companies');

  it.todo('GET: /api/companies');

  it.todo('GET: /api/companies/:id');

  it.todo('PATCH: /api/companies/:id/addresses');

  it.todo('PATCH: /api/companies/:id/banks');

  it.todo('PATCH: /api/companies/:id/brands');

  it.todo('POST: /api/companies/employees');

  it.todo('DELETE: /api/companies/employees/:id');

  it.todo('POST: /api/companies/service-logs');

  it.todo('GET: /api/companies/service-logs');

  it.todo('POST: /api/companies/commissions');

  it.todo('PUT: /api/companies/commissions/:id');

  it.todo('GET: /api/companies/commissions/:id');
});