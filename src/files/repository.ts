import * as Minio from 'minio';
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

  async getFileByName(bucketName: string, fileName: string): Promise<Buffer | null> {
    try {
      const fileStream = await minioClient.getObject(bucketName, fileName);
      const data: Buffer[] = [];

      return new Promise((resolve, reject) => {
        fileStream.on('data', (chunk) => {
          data.push(chunk);
        });

        fileStream.on('end', () => {
          const fileData = Buffer.concat(data);
          resolve(fileData);
        });

        fileStream.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      throw new Error(`Error getting the file: ${error}`);
    }
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
