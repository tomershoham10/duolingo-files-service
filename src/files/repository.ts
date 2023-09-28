import { minioClient } from "../server.js";

export class MinioRepository {

  async uploadFile(bucketName: string, fileName: string, filePath: string) {
    await minioClient.fPutObject(bucketName, fileName, filePath);
  }

  async getFile(bucketName: string, objectName: string) {
    const dataStream = await minioClient.getObject(bucketName, objectName);
    return dataStream;
  }

  async deleteFile(bucketName: string, objectName: string) {
    await minioClient.removeObject(bucketName, objectName);
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
