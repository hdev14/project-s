import FileStorage, { GetFilePublicUrlParams, RemoveFileParams, StoreFileParams } from "./FileStorage";

// TODO: https://min.io/docs/minio/linux/developers/javascript/API.html#javascript-client-api-reference
export default class MinIOStorage implements FileStorage {
  createBucket(bucket_name: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  storeFile(params: StoreFileParams): Promise<string> {
    throw new Error("Method not implemented.");
  }
  getFilePublicUrl(params: GetFilePublicUrlParams): Promise<string> {
    throw new Error("Method not implemented.");
  }
  removeFile(params: RemoveFileParams): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
