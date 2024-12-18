import * as Minio from 'minio';
import { minioClient } from '../server.js';
import { Readable, PassThrough, Stream } from 'stream';
import {
  BucketItemFromList,
  ItemBucketMetadata,
  UploadedObjectInfo,
} from 'minio';
import { FileMetadata, FilesTypes, Metadata, SubTypeGroup } from './model.js';
import { getFormattedMetadata } from '../utils/getFormattedMetadata.js';

export default class MinioRepository {
  static async putObjectPromise(
    bucketName: string,
    objectName: string,
    fileStream: NodeJS.ReadableStream,
    size: number,
    metadata?: Partial<Metadata>
  ): Promise<UploadedObjectInfo | null> {
    try {
      return new Promise<UploadedObjectInfo>((resolve, reject) => {
        // Convert the PassThrough stream to Buffer
        const chunks: Buffer[] = [];
        fileStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        fileStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log(
            'repository - upload - metadata',
            metadata,
            metadata ? JSON.stringify(metadata) : '{}'
          );
          minioClient.putObject(
            bucketName,
            objectName,
            buffer,
            size,
            metadata ? metadata : {},
            function (err, objInfo) {
              if (err) {
                console.error('putObjectPromise - error', err);
                reject(`File upload failed: ${err.message}`);
              } else {
                console.log(`File uploaded successfully ${objInfo}`);
                resolve(objInfo);
              }
            }
          );
        });
      });
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      return null;
    }
  }

  // static async uploadFile(
  //   bucketName: string,
  //   exerciseType: ExerciseTypes,
  //   metadata: Partial<Metadata>,
  //   file: Express.Multer.File
  // ): Promise<UploadedObjectInfo | null> {
  //   try {
  //     // Handle single file
  //     const fileStream = new PassThrough();
  //     fileStream.end(file.buffer);
  //     const fileName = `${exerciseType}/${file.originalname}`;

  //     const res = await MinioRepository.putObjectPromise(
  //       bucketName,
  //       fileName,
  //       fileStream,
  //       file.size as number,
  //       metadata
  //     );

  //     // Wait for all uploads to complete

  //     console.log('repo - upload - success', res);
  //     return res;
  //   } catch (error: any) {
  //     console.error('Repository uploading Error:', error.message);
  //     return null;
  //   }
  // }

  static async uploadFile(
    mainId: string,
    subtypeId: string,
    modelId: string,
    fileType: FilesTypes,
    file: Express.Multer.File,
    metadata?: Partial<Metadata>,
  ): Promise<UploadedObjectInfo | null> {
    try {
      // Handle single file
      const fileStream = new PassThrough();
      fileStream.end(file.buffer);
      const fileName = `${subtypeId}/${modelId}/${fileType}/${file.originalname}`;

      const res = await MinioRepository.putObjectPromise(
        mainId,
        fileName,
        fileStream,
        file.size as number,
        metadata
      );

      // Wait for all uploads to complete

      console.log('repo - upload - success', res);
      return res;
    } catch (error: any) {
      console.error('Repository uploading Error:', error.message);
      return null;
    }
  }

  static async getFileByName(
    bucketName: string,
    fileName: string
  ): Promise<{ stream: Readable; metadata: Metadata }> {
    try {
      const stream = await minioClient.getObject(bucketName, fileName);
      const statPromise = await minioClient.statObject(bucketName, fileName);
      console.log('getFileByName', bucketName, '/', fileName);
      const metadata = statPromise.metaData as Metadata;
      return { stream: stream, metadata: metadata };
    } catch (error: any) {
      console.error('Repository Error (getFileByName):', error.message);
      throw new Error(`repo - getFileByName: ${error}`);
    }
  }

  // static async getFileByName(
  //   bucketName: string,
  //   fileName: string
  // ): Promise<{ stream: Readable; metadata: Metadata }> {
  //   try {
  //     return new Promise(async (resolve, reject) => {
  //       try {
  //         const stream = await minioClient.getObject(bucketName, fileName);
  //         const statPromise = await minioClient.statObject(
  //           bucketName,
  //           fileName
  //         );
  //         console.log('getFileByName', bucketName, '/', fileName);
  //         const metadata = statPromise.metaData as Metadata;
  //         resolve({ stream: stream, metadata: metadata });
  //       } catch (err) {
  //         reject(`getFileByName repo - ${err}`);
  //       }
  //     });
  //   } catch (error: any) {
  //     console.error('Repository Error (getFileByName):', error.message);
  //     throw new Error(`repo - getFileByName: ${error}`);
  //   }
  // }

  static async getFileMetadataByName(
    bucketName: string,
    fileName: string
  ): Promise<Metadata> {
    try {
      const statPromise = await minioClient.statObject(bucketName, fileName);
      console.log('getFileMetadataByName', bucketName, '/', fileName);
      const metadata = statPromise.metaData as Metadata;
      return metadata;
    } catch (error: any) {
      console.error('Repository Error (getFileMetadataByName):', error.message);
      throw new Error(`repo - getFileMetadataByName: ${error}`);
    }
  }

  // static async getFileMetadataByName(
  //   bucketName: string,
  //   fileName: string
  // ): Promise<Metadata> {
  //   try {
  //     return new Promise(async (resolve, reject) => {
  //       try {
  //         const statPromise = await minioClient.statObject(
  //           bucketName,
  //           fileName
  //         );
  //         console.log('getFileByName', bucketName, '/', fileName);
  //         const metadata = statPromise.metaData as Metadata;
  //         resolve(metadata);
  //       } catch (err) {
  //         reject(`getFileByName repo - ${err}`);
  //       }
  //     });
  //   } catch (error: any) {
  //     console.error('Repository Error (getFileByName):', error.message);
  //     throw new Error(`repo - getFileByName: ${error}`);
  //   }
  // }

  static async getAllFilesByBucket(
    bucketName: string,
    prefix?: string
  ): Promise<SubTypeGroup> {
    try {
      console.log('prefix', prefix);
      const objectsStream: Stream = minioClient.listObjects(
        bucketName,
        prefix || '',
        true
      );
      const files: FileMetadata[] = [];

      const statPromises: Promise<void>[] = [];

      objectsStream.on('data', (object) => {
        console.log(
          'getAllFilesByBucket - object',
          object,
          object,
          object.name
        );
        if (object.name) {
          const statPromise = minioClient
            .statObject(bucketName, object.name)
            .then((stat) => {
              const metadata = stat.metaData as ItemBucketMetadata;
              console.log('metadata', metadata);
              const metaKeys = Object.keys(metadata);
              console.log('metaKeys', metaKeys);
              const convertedMetadata = getFormattedMetadata(metadata);
              console.log('convertedMetadata', convertedMetadata);
              const convertedMetadata2 = getFormattedMetadata(metadata);
              console.log('convertedMetadata2', convertedMetadata2);

              files.push({
                id: stat.etag,
                name: object.name,
                metadata: convertedMetadata,
              });
            })
            .catch((error) => {
              console.error(
                `Error getting metadata for ${object.name}:`,
                error
              );
              throw new Error(
                `Error getting metadata for ${object.name}, ${error}`
              );
            });

          statPromises.push(statPromise);
        }
      });

      return new Promise((resolve, reject) => {
        objectsStream.on('end', async () => {
          try {
            await Promise.all(statPromises); // Wait for all statObject calls to complete
            console.log('repo - getAllFilesByBucket - files', files);

            const groupedFiles: SubTypeGroup = {};

            files.forEach((file) => {
              const [subId, modelId, fileType, fileName] = file.name.split('/');

              // Initialize subId group
              if (!groupedFiles[subId]) {
                groupedFiles[subId] = {};
              }

              // Initialize modelId group
              if (!groupedFiles[subId][modelId]) {
                groupedFiles[subId][modelId] = {
                  images: [],
                  records: [],
                };
              }

              // Add file to the appropriate fileType group
              const metadata = {
                id: file.id,
                name: fileName,
                metadata: file.metadata,
              };

              if (fileType === FilesTypes.IMAGES) {
                groupedFiles[subId][modelId].images.push(metadata);
              } else if (fileType === FilesTypes.RECORDS) {
                groupedFiles[subId][modelId].records.push(metadata);
              }
            });

            // if (prefix !== '') {
            //   Object.keys(groupedFiles).forEach((subId) => {
            //     const modelGroup = groupedFiles[subId];
            //     Object.keys(modelGroup).forEach((modelId) => {
            //       const fileTypeGroup = modelGroup[modelId];
            //       fileTypeGroup.images
            //       fileTypeGroup.records = fileTypeGroup.records.filter(
            //         (item) => item.metadata.type === prefix
            //       );
            //     });
            //   });
            // }

            // console.log('after filter', filesWithExerciseType);

            resolve(groupedFiles);
          } catch (error) {
            console.error('Error getAllFilesByBucket:', error);
            reject(error);
          }
        });

        objectsStream.on('error', (error) => {
          console.error('Error getAllFilesByBucket:', error);
          reject(error);
        });
      });
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - getAllFilesByBucket: ${error}`);
    }
  }

  // static async getFileMetadataByETag(
  //   bucketName: string,
  //   etag: string
  // ): Promise<{
  //   name: string;
  //   id: string;
  //   metadata: Partial<Metadata>;
  // } | null> {
  //   try {
  //     console.log('repo - getFileMetadataByETag etag', etag);
  //     const bucketFiles = await MinioRepository.getAllFilesByBucket(
  //       bucketName,
  //       ''
  //     );
  //     const obj = bucketFiles.filter((file) => file.id === etag)[0];
  //     console.log('repo - getFileMetadataByETag obj', obj);
  //     return obj;
  //   } catch (error: any) {
  //     if (error.code === 'NotFound') {
  //       console.error(`File with ETag ${etag} not found.`);
  //       return null;
  //     } else {
  //       console.error('Error retrieving file metadata:', error.message);
  //       throw new Error(`getFileMetadataByETag: ${error}`);
  //     }
  //   }
  // }

  static async isFileExisted(
    bucketName: string,
    fileName: string
  ): Promise<boolean> {
    try {
      const fileStream = await minioClient.getObject(bucketName, fileName);
      return !!fileStream;
    } catch (error: any) {
      if (error.code === 'NoSuchKey') {
        console.log(
          'Repository Error isFileExisted - not found:',
          error.message
        );
        return false;
      } else {
        console.error('Repository Error isFileExisted:', error.message);
        throw new Error(`repo - isFileExisted: ${error}`);
      }
    }
  }

  static async deleteFile(
    mainId: string,
    fileName: string
  ): Promise<boolean> {
    try {
      await minioClient
        .removeObject(mainId, fileName)
        .then(() => {
          return true;
        })
        .catch((err) => {
          console.log(err);
          throw err;
        });
      console.log('deleted');
      return true;
    } catch (error: any) {
      console.error('Repository Error - deleteFile:', error.message);
      // throw new Error(`repo - deleteFile: ${error}`);
      return false;
    }
  }

  static async updateMetadata(
    mainId: string,
    fileName: string,
    newMetadata: Partial<Metadata>
  ): Promise<UploadedObjectInfo | null> {
    try {
      const objectInfo = await minioClient.statObject(mainId, fileName);
      const existingMetadata = objectInfo.metaData;

      const updatedMetadata = {
        ...existingMetadata,
        ...newMetadata,
      };
      console.log('existingMetadata', existingMetadata);
      console.log('newMetadata', newMetadata);
      console.log('updatedMetadata', updatedMetadata);

      const getObjectStream = minioClient.getObject(mainId, fileName);

      const chunks: Buffer[] = [];

      (await getObjectStream).on('data', (chunk) =>
        chunks.push(Buffer.from(chunk))
      );

      // eslint-disable-next-line no-async-promise-executor
      await new Promise<void>(async (resolve, reject) => {
        (await getObjectStream).on('end', () => {
          resolve();
        });
        (await getObjectStream).on('error', (err) => reject(err));
      });

      const buffer = Buffer.concat(chunks);

      const putObjectInfo = await new Promise<UploadedObjectInfo>(
        (resolve, reject) => {
          minioClient.putObject(
            mainId,
            fileName,
            buffer,
            buffer.length,
            updatedMetadata,
            (err, objInfo) => {
              if (err) {
                console.error('putObject - error', err);
                reject(`Metadata update failed: ${err.message}`);
              } else {
                console.log(
                  `Metadata updated successfully: ${objInfo} ${updatedMetadata}`
                );
                resolve(objInfo);
              }
            }
          );
        }
      );

      return putObjectInfo;
    } catch (error: any) {
      if (error.code === 'NoSuchKey') {
        console.error(
          'Repository Error updateMetadata - not found:',
          error.message
        );
        return null;
      } else {
        console.error('Repository Error updateMetadata:', error.message);
        throw new Error(`updateMetadata: ${error}`);
      }
    }
  }

  static async createBucket(bucketName: string): Promise<string> {
    try {
      return new Promise((resolve, reject) => {
        minioClient.makeBucket(bucketName, function (err) {
          if (err) {
            console.log(err);
            reject('File upload failed: ' + err);
          } else {
            console.log('bucket created successfully');
            resolve('bucket created successfully');
          }
        });
      });
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - createBucket: ${error}`);
    }
  }

  static async getBucketsList(): Promise<BucketItemFromList[]> {
    try {
      const buckets = await minioClient.listBuckets();
      return buckets;
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - getBucketsList: ${error}`);
    }
  }

  static async renameObject(
    bucketName: string,
    oldObjectName: string,
    newObjectName: string
  ): Promise<boolean> {
    try {
      // Copy the object to the same bucket with the new name
      const conds = new Minio.CopyConditions();
      const stat = await minioClient.statObject(bucketName, oldObjectName);
      conds.setMatchETag(stat.etag);
      minioClient.copyObject(
        bucketName,
        newObjectName,
        `/${bucketName}/${oldObjectName}`,
        conds,
        function (e, data) {
          if (e) {
            return console.log(e);
          }
          console.log('Successfully copied the object:');
          console.log(
            'etag = ' + data.etag + ', lastModified = ' + data.lastModified
          );
        }
      );

      // Remove the old object
      await minioClient.removeObject(bucketName, oldObjectName);

      console.log(
        `Object "${oldObjectName}" renamed to "${newObjectName}" successfully.`
      );
      return true;
    } catch (error) {
      console.error('Error renaming object:', error);
      return false;
    }
  }
}
