// manager.ts
import { BucketItemFromList, UploadedObjectInfo } from "minio";
import { MinioRepository } from "./repository.js";
import { FileMetadata } from "./model.js";

export default class MinioManager {
  private repository: MinioRepository;

  constructor() {
    this.repository = new MinioRepository();
  }

  async uploadFile(bucketName: string, metadata: string | undefined, files: Express.Multer.File | Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[]; }): Promise<UploadedObjectInfo[]> {
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

  // async uploadFile(bucketName: string, objectName: string, filePath: string, metadata: FileMetadata): Promise<string> {
  //   try {
  //     console.log("manager", bucketName, objectName, filePath);
  //     const response = await this.repository.uploadFile(bucketName, objectName, filePath, metadata);
  //     console.log("manager resopnse", response);
  //     return response;
  //   } catch (error) {
  //     console.error("manager - Error uploadFile:", error);
  //     throw error;
  //   }
  // };

  async getFileByName(bucketName: string, objectName: string): Promise<Buffer | null> {
    try {
      const dataStream = await this.repository.getFileByName(bucketName, objectName);
      // Perform any additional processing here if needed
      return dataStream;
    } catch (error: any) {
      console.error('Manager Error [getFileByName]:', error.message);
      throw new Error('Error in getFileByName');
    }
  }

  async getAllFilesByBucket(bucketName: string): Promise<{ name: string; id: string; metadata: FileMetadata }[]> {
    try {
      const files = await this.repository.getAllFilesByBucket(bucketName);
      return files;
    } catch (error: any) {
      console.error('Manager Error [getAllFilesByBucket]:', error.message);
      throw new Error('Error in getAllFilesByBucket');
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
