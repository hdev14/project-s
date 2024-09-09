export type StoreFileParams = {
  bucket_name: string;
  name: string;
  folder?: string;
  file: Buffer;
}

export type GetFilePublicUrlParams = {
  bucket_name: string;
  private_file_url: string;
}

export type RemoveFileParams = {
  bucket_name: string,
  private_file_url: string
}

export default interface FileStorage {
  createBucket(bucket_name: string): Promise<void>;
  storeFile(params: StoreFileParams): Promise<string>;
  getFilePublicUrl(params: GetFilePublicUrlParams): Promise<string>;
  removeFile(params: RemoveFileParams): Promise<void>;
}
