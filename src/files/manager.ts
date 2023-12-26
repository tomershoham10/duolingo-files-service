// manager.ts
import { BucketItemFromList, UploadedObjectInfo } from "minio";
import { FileMetadata } from "./model.js";
import { MinioRepository } from "./repository.js";

export default class MinioManager {
  private repository: MinioRepository;

  constructor() {
    this.repository = new MinioRepository();
  }

  async uploadFile(bucketName: string, files: Express.Multer.File | Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[]; }): Promise<UploadedObjectInfo[]> {
    try {
      console.log("manager - uploadFile");
      const minioResult = await this.repository.uploadFile(bucketName, files);
      console.log("manager - uploadFile result", minioResult);
      if (minioResult) {
        return minioResult;
      }
      else {
        throw new Error('Error uploading file');
      }

    } catch (error) {
      console.error(error);
      throw new Error('Error uploading file');
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
    } catch (error) {
      console.error("manager - Error getFileByName:", error);
      throw error;
    }
  }

  async getAllFilesByBucket(bucketName: string): Promise<string[]> {
    try {
      const files = await this.repository.getAllFilesByBucket(bucketName);
      return files;
    } catch (error) {
      console.error("manager - Error getAllFilesByBucket:", error);
      throw error;
    }
  }

  async deleteFile(bucketName: string, objectName: string): Promise<boolean> {
    try {
      const response = await this.repository.deleteFile(bucketName, objectName);
      return response;
    } catch (error) {
      console.error("manager - Error deleteFile:", error);
      throw error;
    }
  }

  async createBucket(bucketName: string): Promise<string> {
    try {
      return this.repository.createBucket(bucketName);
    } catch (error) {
      console.error("manager - Error createBucket:", error);
      throw error;
    }
  }

  async getBucketsList(): Promise<BucketItemFromList[]> {
    try {
      return this.repository.getBucketsList();
    } catch (error) {
      console.error("manager - Error getBucketsList:", error);
      throw error;
    }
  }
}
