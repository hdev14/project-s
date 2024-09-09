import { faker } from '@faker-js/faker/locale/pt_BR';
import MinIOStorage from '@global/infra/MinIOStorage';
import { mock, mockClear } from 'jest-mock-extended';
import * as minio from 'minio';

jest.mock('minio');

const minio_mocked = jest.mocked(minio);
const minio_client_mock = mock<minio.Client>();

minio_mocked.Client.mockImplementation(() => minio_client_mock);

afterEach(() => {
  mockClear(minio_client_mock);
});

describe('MinIOStorage unit tests', () => {
  const storage = new MinIOStorage();

  describe('MinIOStorage.createBucket', () => {
    it('should call the minio.makeBucket with correct bucket name', async () => {
      const bucket_name = faker.company.name();

      await storage.createBucket(bucket_name);

      expect(minio_client_mock.makeBucket).toHaveBeenCalledWith(bucket_name);
    });
  });

  describe('MinIOStorage.storeFile', () => {
    it('should call the minio.putObject with all the params', async () => {
      const params = {
        bucket_name: faker.company.name(),
        file: Buffer.from([]),
        name: faker.system.fileName(),
        folder: faker.word.words(),
      };

      minio_client_mock.putObject.mockResolvedValueOnce({ etag: faker.internet.url(), versionId: faker.string.numeric() });

      await storage.storeFile(params);

      expect(minio_client_mock.putObject).toHaveBeenCalledWith(params.bucket_name, `${params.folder}/${params.name}`, params.file);
    });

    it('should call the minio.putObject without folder param', async () => {
      const params = {
        bucket_name: faker.company.name(),
        file: Buffer.from([]),
        name: faker.system.fileName(),
      };

      minio_client_mock.putObject.mockResolvedValueOnce({ etag: faker.internet.url(), versionId: faker.string.numeric() });

      await storage.storeFile(params);

      expect(minio_client_mock.putObject).toHaveBeenCalledWith(params.bucket_name, params.name, params.file);
    });
  });

  it.todo('MinIOStorage.getFilePublicUrl');
  it.todo('MinIOStorage.removeFile');
});
