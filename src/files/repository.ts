import { PassThrough, Stream } from 'stream';
import { minioClient } from "../server.js";
import { BucketItemFromList, UploadedObjectInfo } from 'minio';
import { FileMetadata } from './model.js';

export class MinioRepository {

  async putObjectPromise(bucketName: string, objectName: string, fileStream: NodeJS.ReadableStream, size: number, metadata: string | undefined): Promise<UploadedObjectInfo> {
    try {
      return new Promise<UploadedObjectInfo>((resolve, reject) => {
        // Convert the PassThrough stream to Buffer
        const chunks: Buffer[] = [];
        fileStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        fileStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log("repository - upload - metadata", metadata, JSON.parse(metadata ? metadata : ''))
          minioClient.putObject(bucketName, objectName, buffer, size, JSON.parse(metadata ? metadata : ''), function (err, objInfo) {
            if (err) {
              console.error(err);
              reject(`File upload failed: ${err.message}`);
            } else {
              console.log(`File uploaded successfully ${objInfo}`);
              resolve(objInfo);
            }
          });
        });
      });
    }
    catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - putObjectPromise: ${error}`);
    }
  }

  async uploadFile(bucketName: string, metadata: string | undefined, files: Express.Multer.File | Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[]; }): Promise<UploadedObjectInfo[]> {
    try {
      if (!files) {
        throw new Error('No files provided.');
      }

      const uploadPromises: Promise<UploadedObjectInfo>[] = [];

      if (Array.isArray(files)) {
        // Handle multiple files
        for (const file of files) {
          const fileStream = new PassThrough();
          fileStream.end(file.buffer);
          const uploadPromise = this.putObjectPromise(bucketName, file.originalname, fileStream, file.size, metadata);
          uploadPromises.push(uploadPromise);
        }
      } else {
        // Handle single file
        const fileStream = new PassThrough();
        fileStream.end(files.buffer);

        const uploadPromise = this.putObjectPromise(bucketName, files.originalname as string, fileStream, files.size as number, metadata);
        uploadPromises.push(uploadPromise);
      }

      // Wait for all uploads to complete
      const uploadedFiles = await Promise.all(uploadPromises);

      console.log('repo - upload - success', uploadedFiles);
      return uploadedFiles;
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - uploadFile: ${error}`);
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

  async getAllFilesByBucket(bucketName: string): Promise<{ name: string; id: string; metadata: FileMetadata }[]> {
    try {
      const objectsStream: Stream = minioClient.listObjects(bucketName, "");
      const files: { name: string; id: string; metadata: FileMetadata }[] = [];


      const statPromises: Promise<void>[] = [];

      objectsStream.on('data', (object) => {
        const statPromise = minioClient.statObject(bucketName, object.name)
          .then((stat) => {
            const metadata = stat.metaData as FileMetadata;
            files.push({ name: object.name, id: stat.etag, metadata });
          })
          .catch((error) => {
            console.error(`Error getting metadata for ${object.name}:`, error);
            throw new Error(`Error getting metadata for ${object.name}, ${error}`);
          });

        statPromises.push(statPromise);
      });

      return new Promise((resolve, reject) => {
        objectsStream.on('end', async () => {
          try {
            await Promise.all(statPromises); // Wait for all statObject calls to complete
            console.log('repo - getAllFilesByBucket - files', files);
            resolve(files);
          } catch (error) {
            console.error("Error getAllFilesByBucket:", error);
            reject(error);
          }
        });

        objectsStream.on('error', (error) => {
          console.error("Error getAllFilesByBucket:", error);
          reject(error);
        });
      });
      // objectsStream.on('data', async (object) => {
      //   console.log("check", object);
      //   const stat = await minioClient.statObject(bucketName, object.name); 
      //   console.log("check2", stat);
      //   files.push({ file: object, id: stat.etag, metadata: stat.metaData });
      // });

      // return new Promise((resolve, reject) => {
      //   objectsStream.on('end', () => {
      //     console.log('repo - getAllFilesByBucket - files', files);
      //     resolve(files);
      //   });

      //   objectsStream.on('error', (error) => {
      //     console.error("Error getAllFilesByBucket:", error);
      //     reject(error);
      //   });
      // });
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - getAllFilesByBucket: ${error}`);
    }
  }

  async deleteFile(bucketName: string, objectName: string): Promise<boolean> {
    try {
      await minioClient.removeObject(bucketName, objectName).then(() => { return true }).catch((err) => { console.log(err); throw err; });
      return true;
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - deleteFile: ${error}`);
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
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - createBucket: ${error}`);
    }
  }

  async getBucketsList(): Promise<BucketItemFromList[]> {
    try {
      const buckets = await minioClient.listBuckets();
      return buckets;
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - getBucketsList: ${error}`);
    }
  }
}
