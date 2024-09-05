export default interface FileStorage {
  createBucket(bucket_name: string): Promise<void>;
  storeFile(bucket_name: string, file: File | Buffer): Promise<string>;
  getFilePublicUrl(bucket_name: string, private_file_url: string): Promise<string>;
  removeFile(bucket_name: string, private_file_url: string): Promise<void>;
}
