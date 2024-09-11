import FileStorage, { GetFilePublicUrlParams, RemoveFileParams, StoreFileParams } from "@global/app/FileStorage";
import { injectable } from "inversify";
import * as minio from 'minio';
import 'reflect-metadata';

// TODO: https://min.io/docs/minio/linux/developers/javascript/API.html#javascript-client-api-reference
@injectable()
export default class MinIOStorage implements FileStorage {
  #client: minio.Client;

  constructor() {
    this.#client = new minio.Client({
      endPoint: process.env.STORAGE_BASE_URL!,
      port: parseInt(process.env.STORAGE_PORT!, 10),
      useSSL: false, // TODO: add logic to consider prod env.
      accessKey: process.env.STORAGE_ACCESS_KEY!,
      secretKey: process.env.STORAGE_SECRET_KEY!,
    })
  }

  async createBucket(bucket_name: string): Promise<void> {
    await this.#client.makeBucket(bucket_name);
  }

  async storeFile(params: StoreFileParams): Promise<string> {
    const object_name = params.folder ? `${params.folder}/${params.name}` : params.name;

    const result = await this.#client.putObject(params.bucket_name, object_name, params.file);

    // TODO: check if the etag serves as private url.
    return result.etag;
  }

  async getFilePublicUrl(params: GetFilePublicUrlParams): Promise<string> {
    throw new Error("Method not implemented.");
  }

  async removeFile(params: RemoveFileParams): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
