import internal, { PassThrough, Stream } from 'stream';
import { minioClient } from "../server.js";
import { BucketItemFromList, ItemBucketMetadata, UploadedObjectInfo } from 'minio';
import * as Minio from 'minio';
import { RecordMetadata, SignatureTypes, SonarSystem, SonogramMetadata, SonolistStream } from './model.js';

export class MinioRepository {

  async putObjectPromise(bucketName: string, objectName: string, fileStream: NodeJS.ReadableStream, size: number, metadata: Partial<RecordMetadata> | Partial<SonogramMetadata>): Promise<UploadedObjectInfo> {
    try {
      return new Promise<UploadedObjectInfo>((resolve, reject) => {
        // Convert the PassThrough stream to Buffer
        const chunks: Buffer[] = [];
        fileStream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        fileStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          console.log("repository - upload - metadata", metadata, metadata ? JSON.stringify(metadata) : '{}');
          minioClient.putObject(bucketName, objectName, buffer, size, metadata ? metadata : {}, function (err, objInfo) {
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


  async uploadFile(bucketName: string, metadata: Partial<RecordMetadata> | Partial<SonogramMetadata>, files: Express.Multer.File | Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[]; }): Promise<UploadedObjectInfo[]> {
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

  async getFileByName(bucketName: string, fileName: string): Promise<{ stream: internal.Readable, metadata: RecordMetadata | SonogramMetadata }> {
    try {
      return new Promise(async (resolve, reject) => {
        try {
          const stream = await minioClient.getObject(bucketName, fileName);
          const statPromise = await minioClient.statObject(bucketName, fileName)
          console.log('getFileByName', bucketName, '/', fileName);
          const metadata = statPromise.metaData as RecordMetadata | SonogramMetadata;
          resolve({ stream: stream, metadata: metadata });
        } catch (err) {
          reject(`getFileByName repo - ${err}`);
        }
      });
    } catch (error: any) {
      console.error('Repository Error (getFileByName):', error.message);
      throw new Error(`repo - getFileByName: ${error}`);
    }
  };


  async getAllFilesByBucket(bucketName: string): Promise<{ name: string; id: string; metadata: Partial<RecordMetadata> | Partial<SonogramMetadata> }[]> {
    try {
      const objectsStream: Stream = minioClient.listObjects(bucketName, "");
      const files: { name: string; id: string; metadata: Partial<RecordMetadata> | Partial<SonogramMetadata> }[] = [];


      const statPromises: Promise<void>[] = [];

      objectsStream.on('data', (object) => {
        const statPromise = minioClient.statObject(bucketName, object.name)
          .then((stat) => {
            const metadata = stat.metaData as ItemBucketMetadata;
            const metaKeys = Object.keys(metadata);
            console.log("metaKeys", metaKeys)
            let convertedMetadata: Partial<RecordMetadata> | Partial<SonogramMetadata> = {};

            for (const key in metadata) {
              if (metadata.hasOwnProperty(key)) {
                switch (key) {


                  // Map each key to its corresponding type
                  case 'record_length':
                  case 'difficulty_level':
                  case 'channels_number':

                    if (metaKeys.includes(key)) {
                      console.log('record_length', metadata[key], parseFloat(metadata[key]));
                      (convertedMetadata as Partial<RecordMetadata>)[key] = parseFloat(metadata[key]);
                    }
                    break;
                  case 'sonograms_ids':
                  case 'targets_ids_list':
                    if (metaKeys.includes(key)) {
                      (convertedMetadata as Partial<RecordMetadata>)[key] = metadata[key].split(', ')[0].length > 0 ? metadata[key].split(', ') : [];
                    }
                    break;
                  case 'operation':
                  case 'source_id':
                    if (metaKeys.includes(key)) {
                      (convertedMetadata as Partial<RecordMetadata>)[key] = metadata[key];
                    }
                    break;
                  case 'is_in_italy':
                  case 'is_backround_vessels':
                  case 'aux':
                    if (metaKeys.includes(key)) {
                      (convertedMetadata as Partial<RecordMetadata>)[key] = metadata[key] === 'true';
                    }
                    break;
                  case 'signature_type':
                    if (metaKeys.includes(key)) {
                      (convertedMetadata as Partial<RecordMetadata>)[key] = SignatureTypes[metadata[key] as keyof typeof SignatureTypes];
                    }
                    break;
                  case 'sonar_system':
                    if (metaKeys.includes(key)) {
                      (convertedMetadata as Partial<RecordMetadata>)['sonar_system'] = metadata[key] as SonarSystem;
                    }
                    break;
                  case 'fft':
                  case 'bw':
                    if (metaKeys.includes(key)) {
                      (convertedMetadata as Partial<SonogramMetadata>)[key] = parseFloat(metadata[key]);
                    }
                    break;
                  case 'sonogram_type':
                    if (metaKeys.includes(key)) {
                      (convertedMetadata as Partial<SonogramMetadata>)['sonogram_type'] = metadata[key] as SonarSystem;
                    }
                    break;
                  // Handle other cases here
                  default:
                    // If key doesn't match any known properties, ignore it
                    break;
                }
              }
            }

            // console.log("convertedMetadata", convertedMetadata);

            files.push({ name: object.name, id: stat.etag, metadata: convertedMetadata });
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
    } catch (error: any) {
      console.error('Repository Error:', error.message);
      throw new Error(`repo - getAllFilesByBucket: ${error}`);
    }
  }

  async getFileMetadataByETag(bucketName: string, etag: string): Promise<{
    name: string,
    id: string,
    metadata: Partial<RecordMetadata> | Partial<SonogramMetadata>
  }
    | null> {
    try {
      console.log('repo - getFileMetadataByETag etag', etag);
      const bucketFiles = await this.getAllFilesByBucket(bucketName);
      const obj = bucketFiles.filter(file => file.id === etag)[0];
      console.log('repo - getFileMetadataByETag obj', obj);
      return obj;
    } catch (error: any) {
      if (error.code === 'NotFound') {
        console.error(`File with ETag ${etag} not found.`);
        return null;
      } else {
        console.error('Error retrieving file metadata:', error.message);
        throw new Error(`getFileMetadataByETag: ${error}`);
      }
    }
  }

  async getSonolistNamesByRecordName(recordName: string): Promise<string[]> {
    try {
      const bucketName = "records";
      const stat = await minioClient.statObject(bucketName, recordName);
      if (!!!stat) return [];
      const metadata = stat.metaData as Partial<RecordMetadata>;
      console.log(".sonograms_ids", metadata.sonograms_ids, metadata.sonograms_ids?.length);
      if (metadata.sonograms_ids === undefined || metadata.sonograms_ids.length <= 0) return [];
      let sonolist: string[] = [];
      if (typeof metadata.sonograms_ids === 'string') {
        sonolist = [metadata.sonograms_ids];
      } else if (Array.isArray(metadata.sonograms_ids)) {
        sonolist = metadata.sonograms_ids;
      }
      // console.log("getSonolistByRecordName repo", sonolist);
      return sonolist;
      // const filesStreams: SonolistStream[] = [];
      // for (const fileName of sonolist) {
      //   const stream = await this.getFileByName('sonograms', fileName);
      //   const sonoStream = { fileName: fileName, fileStream: stream };
      //   filesStreams.push(sonoStream);
      //   filesStreams.push(sonoStream);
      //   // const url = await createBlobUrlFromStream(stream);
      //   // console.log("getSonolistByRecordName url", url);
      //   // urls.push(url);
      // }

      // console.log("getSonolistByRecordName repo - filesStreams", filesStreams);
      // return filesStreams;



      // const promises = sonolist.map(fileName => this.getFileByName('sonograms', fileName));
      // const fileStreams = await Promise.all(promises);
      // console.log("getSonolistByRecordName repo - fileStreams", fileStreams);
      // return fileStreams;

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
        console.log('Repository Error isFileExisted - not found:', error.message);
        return false;
      } else {
        console.error('Repository Error isFileExisted:', error.message);
        throw new Error(`repo - isFileExisted: ${error}`);
      }
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
      console.log("existingMetadata", existingMetadata);
      console.log("newMetadata", newMetadata);
      console.log("updatedMetadata", updatedMetadata);

      const getObjectStream = minioClient.getObject(bucketName, fileName);

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

  async renameObject(bucketName: string, oldObjectName: string, newObjectName: string): Promise<boolean> {
    try {
      // Copy the object to the same bucket with the new name
      var conds = new Minio.CopyConditions();
      const stat = await minioClient.statObject(bucketName, oldObjectName);
      conds.setMatchETag(stat.etag);
      minioClient.copyObject(bucketName, newObjectName, `/${bucketName}/${oldObjectName}`, conds, function (e, data) {
        if (e) {
          return console.log(e)
        }
        console.log('Successfully copied the object:')
        console.log('etag = ' + data.etag + ', lastModified = ' + data.lastModified)
      });

      // Remove the old object
      await minioClient.removeObject(bucketName, oldObjectName);

      console.log(`Object "${oldObjectName}" renamed to "${newObjectName}" successfully.`);
      return true;
    } catch (error) {
      console.error('Error renaming object:', error);
      return false;
    }
  }
}

// async function createBlobUrlFromStream(stream: NodeJS.ReadableStream): Promise<string> {
//   return new Promise((resolve, reject) => {
//     const chunks: Uint8Array[] = [];
//     stream.on('data', (chunk: Uint8Array) => {
//       chunks.push(chunk);
//     });

//     stream.on('end', () => {
//       const buffer = Buffer.concat(chunks);

//       // Create a Blob from the Buffer
//       const blob = new Blob([buffer], { type: 'image/*' });

//       // Create Blob URL
//       const blobURL = URL.createObjectURL(blob);

//       // Clean up blobURL when done
//       resolve(blobURL);
//     });

//     stream.on('error', (err: Error) => {
//       reject(err);
//     });
//   });
// }
