// manager.ts
import { MinioRepository } from "./repository.js";

export default class MinioManager {
  private repository: MinioRepository;

  constructor(bucketName: string) {
    this.repository = new MinioRepository(bucketName);
  }

  async uploadFile(objectName: string, filePath: string) {
    await this.repository.uploadFile(objectName, filePath);
  }

  async getFile(objectName: string) {
    const dataStream = await this.repository.getFile(objectName);
    // Perform any additional processing here if needed
    return dataStream;
  }

  async deleteFile(objectName: string) {
    await this.repository.deleteFile(objectName);
  }

  async createBucket(bucketName: string) {
    return this.repository.createBucket(bucketName);
  }

  async bucketsList() {
    return this.repository.bucketsList();
  }
}
