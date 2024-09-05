import FileStorage from "./FileStorage";

export default class MinIOStorage implements FileStorage {
  createBucket(bucket_name: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  storeFile(bucket_name: string, file: File | Buffer): Promise<string> {
    throw new Error("Method not implemented.");
  }

  getFilePublicUrl(bucket_name: string, private_file_url: string): Promise<string> {
    throw new Error("Method not implemented.");
  }

  removeFile(bucket_name: string, private_file_url: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
