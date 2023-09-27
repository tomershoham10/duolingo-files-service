import { minioClient } from "../server.js";

export class MinioRepository {
  constructor(private bucketName: string) {}

  async uploadFile(objectName: string, filePath: string) {
    await minioClient.fPutObject(this.bucketName, objectName, filePath);
  }

  async getFile(objectName: string) {
    const dataStream = await minioClient.getObject(this.bucketName, objectName);
    return dataStream;
  }

  async deleteFile(objectName: string) {
    await minioClient.removeObject(this.bucketName, objectName);
  }

  async createBucket(bucketName: string) {
    try {
      await minioClient.makeBucket(bucketName, "");
      console.log("Bucket created successfully:", bucketName);
    } catch (error) {
      console.error("Error creating bucket:", error);
      throw error;
    }
  }

  async bucketsList() {
    try {
      const buckets = await minioClient.listBuckets();
      return buckets;
    } catch (error) {
      console.error("Error listing buckets:", error);
      throw error;
    }
  }
}
