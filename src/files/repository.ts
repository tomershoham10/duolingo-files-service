import { PassThrough, Readable, Stream } from 'stream';
import { minioClient } from "../server.js";
import { BucketItemFromList, UploadedObjectInfo, CopyConditions } from 'minio';
import { RecordMetadata, SonogramMetadata } from './model.js';

export class MinioRepository {

  async putObjectPromise(bucketName: string, objectName: string, fileStream: NodeJS.ReadableStream, size: number, metadata: string | undefined): Promise<UploadedObjectInfo> {
    try {
      return new Promise<UploadedObjectInfo>((resolve, reject) => {
        // Convert the PassThrough stream to Buffer
        const chunks: Buffer[] = [];
        fileStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        fileStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log("repository - upload - metadata", metadata, JSON.parse(metadata || '{}'))
          minioClient.putObject(bucketName, objectName, buffer, size, JSON.parse(metadata || '{}'), function (err, objInfo) {
            if (err) {
              console.error("putObjectPromise - error", err);
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

  async getAllFilesByBucket(bucketName: string): Promise<{ name: string; id: string; metadata: RecordMetadata | SonogramMetadata }[]> {
    try {
      const objectsStream: Stream = minioClient.listObjects(bucketName, "");
      const files: { name: string; id: string; metadata: RecordMetadata | SonogramMetadata }[] = [];


      const statPromises: Promise<void>[] = [];

      objectsStream.on('data', (object) => {
        const statPromise = minioClient.statObject(bucketName, object.name)
          .then((stat) => {
            const metadata = stat.metaData as RecordMetadata | SonogramMetadata;
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

  async getSonolistByRecordName(recordName: string): Promise<string> {
    try {
      const bucketName = "records";
      const objectsStream: Stream = minioClient.listObjects(bucketName, "");
      const data: Buffer[] = [];
      let record: { name: string; id: string; metadata: RecordMetadata | SonogramMetadata };

      const try1 = await new Promise<any>((resolve, reject) => {
        objectsStream.on('data', async () => {
          try {
            const stat = await minioClient.statObject(bucketName, recordName);
            const metadata = stat.metaData as RecordMetadata | SonogramMetadata;
            record = { name: recordName, id: stat.etag, metadata };
          } catch (error) {
            console.error(`Error getting metadata for ${recordName}:`, error);
            reject(`Error getting metadata for ${recordName}, ${error}`);
          }
        });

        objectsStream.on('end', () => {
          resolve(record);
        });

        objectsStream.on('error', (error) => {
          console.error("Error getAllFilesByBucket:", error);
          reject(error);
        });
      });

      console.log("getSonolistByRecordName", try1);
      return try1; // Adjust this based on what you want to return
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - getAllFilesByBucket: ${error}`);
    }
  }

  async isFileExisted(fileName: string, bucketName: string): Promise<boolean> {
    try {
      const fileStream = await minioClient.getObject(bucketName, fileName);
      return !!fileStream;
    }
    catch (error: any) {

      if (error.code === 'NoSuchKey') {
        console.error('Repository Error isFileExisted - not found:', error.message);
        return false;
      } else {
        console.error('Repository Error isFileExisted:', error.message);
        throw new Error(`repo - isFileExisted: ${error}`);
      }
    }
  }

  // async getSonolistByRecordName(recordName: string): Promise<string> {
  //   try {
  //     const bucketName = "records";
  //     const objectsStream: Stream = minioClient.listObjects(bucketName, "");
  //     const data: Buffer[] = [];
  //     let record: { name: string; id: string; metadata: RecordMetadata | SonogramMetadata };

  //     const try1 = await new Promise<string>((resolve, reject) => {
  //       objectsStream.on('data', (object) => {
  //         minioClient.statObject(bucketName, recordName)
  //           .then((stat) => {
  //             console.log("stat", stat);
  //             const metadata = stat.metaData as RecordMetadata | SonogramMetadata;
  //             record = { name: object.name, id: stat.etag, metadata };
  //           })
  //           .catch((error) => {
  //             console.error(`Error getting metadata for ${object.name}:`, error);
  //             throw new Error(`Error getting metadata for ${object.name}, ${error}`);
  //           });

  //       })
  //       objectsStream.on('end', () => {
  //         const fileData = Buffer.concat(data);
  //         console.log("fileData", fileData);
  //         resolve(fileData.toString());
  //       });
  //       objectsStream.on('error', (error) => {
  //         console.error("Error getAllFilesByBucket:", error);
  //         reject(error);
  //       });
  //     });

  //     console.log("getSonolistByRecordName", try1);
  //     return 'a';
  //   } catch (error: any) {
  //     console.error('Repository Error:', error.message);
  //     throw new Error(`repo - getAllFilesByBucket: ${error}`);
  //   }
  // }

  async deleteFile(bucketName: string, objectName: string): Promise<boolean> {
    try {
      await minioClient.removeObject(bucketName, objectName).then(() => { return true }).catch((err) => { console.log(err); throw err; });
      return true;
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - deleteFile: ${error}`);
    }
  }

  // async updateMetadata(fileName: string, bucketName: string, newMetadata: Partial<RecordMetadata> | Partial<SonogramMetadata>): Promise<UploadedObjectInfo | null> {
  //   try {
  //     return new Promise<UploadedObjectInfo>((resolve, reject) => {
  //       const objectsStream = minioClient.listObjectsV2(bucketName, '', true);
  //       objectsStream.on('data', async (obj) => {
  //         const objName = obj.name;
  //         const objSize = obj.size
  //         if (objName === fileName) {
  //           const fileStream = new PassThrough();
  //           const chunks: Buffer[] = [];
  //           fileStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));

  //           const existingMetadata = await minioClient.statObject(bucketName, fileName).then(stat => stat.metaData);
  //           const updatedMetadata = {
  //             ...existingMetadata,
  //             ...newMetadata,
  //           };
  //           console.log("updateMetadata repo - updatedMetadata", updatedMetadata);
  //           fileStream.on('end', () => {

  //             const buffer = Buffer.concat(chunks);

  //             minioClient.putObject(bucketName, objName, buffer, objSize, updatedMetadata, function (err, objInfo) {
  //               if (err) {
  //                 console.error("putObjectPromise - error", err);
  //                 reject(`metadata update failed: ${err.message}`);
  //               } else {
  //                 console.log(`metadata updated successfully ${objInfo} ${updatedMetadata}`);
  //                 resolve(objInfo);
  //               }
  //             });
  //           })
  //         }
  //       })
  //     });
  //   }
  //   catch (error: any) {

  //     if (error.code === 'NoSuchKey') {
  //       console.error('Repository Error isFileExisted - not found:', error.message);
  //       return null;
  //     } else {
  //       console.error('Repository Error isFileExisted:', error.message);
  //       throw new Error(`repo - isFileExisted: ${error}`);
  //     }
  //   }
  // }


  async updateMetadata(
    fileName: string,
    bucketName: string,
    newMetadata: Partial<RecordMetadata> | Partial<SonogramMetadata>
  ): Promise<UploadedObjectInfo | null> {
    try {
      const objectInfo = await minioClient.statObject(bucketName, fileName);
      const existingMetadata = objectInfo.metaData;

      const updatedMetadata = {
        ...existingMetadata,
        ...newMetadata,
      };

      console.log("existingMetadata",existingMetadata);
      console.log("newMetadata",newMetadata);
      console.log("updatedMetadata",updatedMetadata);

      const getObjectStream = minioClient.getObject(bucketName, fileName) ;

      const chunks: Buffer[] = [];

      (await getObjectStream).on('data', (chunk) => chunks.push(Buffer.from(chunk)));

      await new Promise<void>(async (resolve, reject) => {
        (await getObjectStream).on('end', () => {
          resolve();
        });
        (await getObjectStream).on('error', (err) => reject(err));
      });

      const buffer = Buffer.concat(chunks);

      const putObjectInfo = await new Promise<UploadedObjectInfo>((resolve, reject) => {
        minioClient.putObject(bucketName, fileName, buffer, buffer.length, updatedMetadata, (err, objInfo) => {
          if (err) {
            console.error('putObject - error', err);
            reject(`Metadata update failed: ${err.message}`);
          } else {
            console.log(`Metadata updated successfully: ${objInfo} ${updatedMetadata}`);
            resolve(objInfo);
          }
        });
      });

      return putObjectInfo;
    } catch (error: any) {
      if (error.code === 'NoSuchKey') {
        console.error('Repository Error updateMetadata - not found:', error.message);
        return null;
      } else {
        console.error('Repository Error updateMetadata:', error.message);
        throw new Error(`updateMetadata: ${error}`);
      }
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
