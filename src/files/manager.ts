// manager.ts
import { MinioRepository } from "./repository.js";

export default class MinioManager {
  private repository: MinioRepository;

  constructor() {
    this.repository = new MinioRepository();
  }

  async uploadFile(bucketName: string, objectName: string, filePath: string) {
    await this.repository.uploadFile(bucketName, objectName, filePath);
  }

  async getFile(bucketName: string, objectName: string) {
    const dataStream = await this.repository.getFile(bucketName, objectName);
    // Perform any additional processing here if needed
    return dataStream;
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
