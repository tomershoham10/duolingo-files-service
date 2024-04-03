// manager.ts
import { BucketItemFromList, UploadedObjectInfo } from "minio";
import { MinioRepository } from "./repository.js";
import { RecordMetadata, SonogramMetadata } from "./model.js";

export default class MinioManager {
  private repository: MinioRepository;

  constructor() {
    this.repository = new MinioRepository();
  }

  async uploadFile(bucketName: string, metadata: Partial<RecordMetadata> | Partial<SonogramMetadata>, files: Express.Multer.File | Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[]; }): Promise<UploadedObjectInfo[]> {
    try {
      console.log("manager - uploadFile");
      const minioResult = await this.repository.uploadFile(bucketName, metadata, files);
      console.log("manager - uploadFile result", minioResult);
      if (minioResult) {
        return minioResult;
      }
      else {
        throw new Error('Error uploading file');
      }

    } catch (error: any) {
      console.error('Manager Error [uploadFile]:', error.message);
      throw new Error('Error in uploadFile');
    }
  }

  async getFileByName(bucketName: string, imageName: string): Promise<NodeJS.ReadableStream> {
    const imageUrl = await this.repository.getFileByName(bucketName, imageName);
    return imageUrl;
  };

  async getFileMetadataByETag(bucketName: string, etag: string): Promise<{
    name: string,
    id: string,
    metadata: Partial<RecordMetadata> | Partial<SonogramMetadata>
  } | null> {
    try {
      const objectInfo = await this.repository.getFileMetadataByETag(bucketName, etag);
      return objectInfo;
    } catch (error: any) {
      console.error('Error retrieving file metadata:', error.message);
      throw new Error(`getFileMetadataByETag: ${error}`);
    }
  }

  async getAllFilesByBucket(bucketName: string): Promise<{ name: string; id: string; metadata: Partial<RecordMetadata> | Partial<SonogramMetadata> }[]> {
    try {
      const files = await this.repository.getAllFilesByBucket(bucketName);
      return files;
    } catch (error: any) {
      console.error('Manager Error [getAllFilesByBucket]:', error.message);
      throw new Error('Error in getAllFilesByBucket');
    }
  }

  async getSonolistByRecordName(recordId: string): Promise<NodeJS.ReadableStream[]> {
    try {
      const files = await this.repository.getSonolistByRecordName(recordId);
      return files;
    } catch (error: any) {
      console.error('Manager Error [getSonolistByRecordName]:', error.message);
      throw new Error(error.message);
    }
  }

  async isFileExisted(fileName: string, bucketName: string): Promise<boolean> {
    try {
      const status = await this.repository.isFileExisted(fileName, bucketName);
      return status;
    } catch (error: any) {
      console.error('Manager Error [isFileExisted]:', error.message);
      throw new Error('Error in isFileExisted');
    }
  }

  async updateMetadata(fileName: string, bucketName: string, meatadata: Partial<RecordMetadata> | Partial<SonogramMetadata>): Promise<UploadedObjectInfo | null> {
    try {
      const updatedFile = await this.repository.updateMetadata(fileName, bucketName, meatadata);
      return updatedFile;
    } catch (error: any) {
      console.error('Manager Error [updateMetadata]:', error.message);
      throw new Error('Error in updateMetadata');
    }
  }


  async deleteFile(bucketName: string, objectName: string): Promise<boolean> {
    try {
      const response = await this.repository.deleteFile(bucketName, objectName);
      return response;
    } catch (error: any) {
      console.error('Manager Error [deleteFile]:', error.message);
      throw new Error('Error in deleteFile');
    }
  }

  async createBucket(bucketName: string): Promise<string> {
    try {
      return this.repository.createBucket(bucketName);
    } catch (error: any) {
      console.error('Manager Error [createBucket]:', error.message);
      throw new Error('Error in createBucket');
    }
  }

  async getBucketsList(): Promise<BucketItemFromList[]> {
    try {
      return this.repository.getBucketsList();
    } catch (error: any) {
      console.error('Manager Error [getBucketsList]:', error.message);
      throw new Error('Error in getBucketsList');
    }
  }
}
