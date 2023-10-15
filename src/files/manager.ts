// manager.ts
import { MinioRepository } from "./repository.js";

export default class MinioManager {
  private repository: MinioRepository;

  constructor() {
    this.repository = new MinioRepository();
  }

  async uploadFile(bucketName: string, objectName: string, filePath: string): Promise<string> {
    console.log("manager", bucketName, objectName, filePath);
    const response = await this.repository.uploadFile(bucketName, objectName, filePath);
    console.log("manager resopnse", response);
    return response;
  }

  async getFileByName(bucketName: string, objectName: string) {
    const dataStream = await this.repository.getFileByName(bucketName, objectName);
    // Perform any additional processing here if needed
    return dataStream;
  }

  async getAllFilesByBucket(bucketName: string) {
    const files = await this.repository.getAllFilesByBucket(bucketName);
    return files;
  }

  async deleteFile(bucketName: string, objectName: string) {
    await this.repository.deleteFile(bucketName, objectName);
  }

  async createBucket(bucketName: string) {
    return this.repository.createBucket(bucketName);
  }

  async bucketsList() {
    return this.repository.bucketsList();
  }
}
