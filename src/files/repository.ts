import { Stream } from 'stream';
import { minioClient } from "../server.js";
import { FileMetadata } from './model.js';

export class MinioRepository {
  async uploadFile(bucketName: string, objectName: string, filePath: string, metadata: FileMetadata): Promise<string> {
    console.log("repo", bucketName, objectName, filePath);
    const size = metadata.size;
    return new Promise((resolve, reject) => {

      minioClient.putObject(bucketName, objectName, filePath, size, metadata, function (err, objInfo) {
        if (err) {
          console.log(err);
          reject('File upload failed: ' + err.message);
        } else {
          console.log(`File uploaded successfully ${objInfo}`);
          resolve("File uploaded successfully");
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

  async getAllFilesByBucket(bucketName: string) {

    try {
      const objectsStream: Stream = minioClient.listObjects(bucketName, ""); // Use the Stream type
      const fileNames: string[] = [];

      objectsStream.on('data', (object) => {
        fileNames.push(object.name);
      });

      // Handle the end of the stream
      objectsStream.on('end', () => {
        console.log("files service repo - get all files by bucket", fileNames);
      });

      // Return a Promise that resolves when the stream ends
      return new Promise((resolve, reject) => {
        objectsStream.on('end', () => {
          resolve(fileNames);
        });

        objectsStream.on('error', (error) => {
          console.error("Error listing files:", error);
          reject(error);
        });
      });
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
