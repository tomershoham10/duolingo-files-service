import { PassThrough, Stream } from 'stream';
import { minioClient } from "../server.js";
import { FileMetadata } from './model.js';
import { BucketItemFromList, UploadedObjectInfo } from 'minio';

export class MinioRepository {

  async putObjectPromise(bucketName: string, objectName: string, fileStream: NodeJS.ReadableStream, size: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      // Convert the PassThrough stream to Buffer
      const chunks: Buffer[] = [];
      fileStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      fileStream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        minioClient.putObject(bucketName, objectName, buffer, size, function (err, objInfo) {
          if (err) {
            console.error(err);
            reject(`File upload failed: ${err.message}`);
          } else {
            console.log(`File uploaded successfully ${objInfo}`);
            resolve("File uploaded successfully");
          }
        });
      });
    });
  }

  async uploadFile(bucketName: string, files: Express.Multer.File | Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[]; }): Promise<string> {
    try {
      if (!files) {
        throw new Error('No files provided.');
      }

      const uploadPromises: Promise<string>[] = [];

      if (Array.isArray(files)) {
        // Handle multiple files
        for (const file of files) {
          const fileStream = new PassThrough();
          fileStream.end(file.buffer);
          const uploadPromise = this.putObjectPromise(bucketName, file.originalname, fileStream, file.size);
          uploadPromises.push(uploadPromise);
        }
      } else {
        // Handle single file
        const fileStream = new PassThrough();
        fileStream.end(files.buffer);

        const uploadPromise = this.putObjectPromise(bucketName, files.originalname as string, fileStream, files.size as number);
        uploadPromises.push(uploadPromise);
      }

      // Wait for all uploads to complete
      await Promise.all(uploadPromises);

      console.log('repo - upload - success');
      return 'Files uploaded successfully';
    } catch (error) {
      console.error(error);
      throw new Error('Error uploading file');
    }
  };


  // try {
  //   // Use Minio client to upload the file
  //   const fileStream = new Stream.PassThrough();
  //   fileStream.end(file.buffer);
  //   console.log("repo - upload", file);

  //   await minioClient.putObject(bucketName, file.originalname, fileStream, file.size);
  //   console.log("repo - upload - success");
  //   return 'File uploaded successfully';
  // } catch (error) {
  //   console.error(error);
  //   throw new Error('Error uploading file');
  // }



  // async uploadFile(bucketName: string, objectName: string, filePath: string, metadata: FileMetadata): Promise<string> {
  //   try {

  //     console.log("repo", bucketName, objectName, filePath);
  //     const size = metadata.size;
  //     const response = await new Promise<string>((resolve, reject) => {
  //       minioClient.putObject(bucketName, objectName, filePath, size, metadata, function (err, objInfo) {
  //         if (err) {
  //           console.log(err);
  //           reject('File upload failed: ' + err.message);
  //         } else {
  //           console.log(`File uploaded successfully ${objInfo}`);
  //           resolve("File uploaded successfully");
  //         }
  //       });
  //     });
  //     return response;
  //   } catch (error) {
  //     console.error(`Error uploading file: ${error}`);
  //     throw new Error(`Error uploding the file: ${error}`);
  //   }
  // }

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
      throw new Error(`Error getFileByName: ${error}`);
    }
  }

  async getAllFilesByBucket(bucketName: string): Promise<string[]> {
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
          console.error("Error getAllFilesByBucket:", error);
          reject(error);
        });
      });
    } catch (error) {
      console.error("Error getAllFilesByBucket", error);
      throw error;
    }
  }

  async deleteFile(bucketName: string, objectName: string): Promise<boolean> {
    try {
      await minioClient.removeObject(bucketName, objectName).then(() => { return true }).catch((err) => { console.log(err); throw err; });
      return true;
    } catch (error) {
      console.error("Error deleteFile", error);
      throw error;
    }
  }

  async createBucket(bucketName: string): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        minioClient.makeBucket(bucketName, function (err) {
          if (err) {
            console.log(err);
            reject('File upload failed: ' + err);
          } else {
            console.log("bucket created successfully");
            resolve("bucket created successfully");

          }
        })
      })
    } catch (error) {
      console.error("Error creating bucket:", error);
      throw error;
    }
  }

  async getBucketsList(): Promise<BucketItemFromList[]> {
    try {
      const buckets = await minioClient.listBuckets();
      return buckets;
    } catch (error) {
      console.error("Error getBucketsList:", error);
      throw error;
    }
  }
}
