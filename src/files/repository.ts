// import fs from 'fs'
import { minioClient } from "../server.js";

export class MinioRepository {

  async uploadFile(bucketName: string, objectName: string, filePath: string): Promise<string> {
    console.log("repo", bucketName, objectName, filePath);
    return new Promise((resolve, reject) => {

      minioClient.putObject(bucketName, objectName, filePath, (err: Error | null, etag: string) => {
        if (err) {
          console.log(err);
          reject('File upload failed: ' + err.message);
        } else {
          console.log(`File uploaded successfully ${etag}`);
          resolve(etag);
        }
      })
    })
  }

  async getFileByName(bucketName: string, objectName: string) {
    const dataStream = await minioClient.getObject(bucketName, objectName);
    return dataStream;
  }

  getAllFilesByBucket(bucketName: string) {
    try {
      const objects = minioClient.listObjects(bucketName, "");
      const fileNames = objects.map((object) => object.name);
      console.log("files service repo - get all files by bucket", fileNames)

      return fileNames;
    } catch (error) {
      console.error("Error listing files:", error);
      throw error;
    }
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
