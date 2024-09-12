// manager.ts
import { BucketItemFromList, UploadedObjectInfo } from 'minio';
import MinioRepository from './repository.js';
import { ExerciseTypes, FilesTypes, Metadata, SubTypeGroup } from './model.js';
import { Readable } from 'stream';

export default class MinioManager {
  static async uploadFile(
    mainId: string,
    subtypeId: string,
    modelId: string,
    fileType: FilesTypes,
    file: Express.Multer.File,
    metadata?: Partial<Metadata>
  ): Promise<UploadedObjectInfo | null> {
    try {
      console.log('manager - uploadFile');
      const minioResult = await MinioRepository.uploadFile(
        mainId,
        subtypeId,
        modelId,
        fileType,
        file,
        metadata,
      );
      console.log('manager - uploadFile result', minioResult);
      if (!minioResult) {
        throw new Error('Error uploading file');
      }
      return minioResult;
    } catch (error: any) {
      console.error('Manager Error [uploadFile]:', error.message);
      return null;
    }
  }

  static async getFileByName(
    mainId: string,
    subtypeId: string,
    modelId: string,
    fileType: string,
    objectName: string
  ): Promise<{ stream: Readable; metadata: Metadata }> {
    const fileName = `${subtypeId}/${modelId}/${fileType}/${objectName}`;
    const fileObject = await MinioRepository.getFileByName(
      mainId,
      fileName
    );
    return fileObject;
  }

  static async getFileMetadataByName(
    mainId: string,
    subtypeId: string,
    modelId: string,
    fileType: string,
    objectName: string,
  ): Promise<Metadata> {
    const fileName = `${subtypeId}/${modelId}/${fileType}/${objectName}`;
    const metadata = await MinioRepository.getFileMetadataByName(
      mainId,
      fileName
    );
    return metadata;
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
  //     const objectInfo = await MinioRepository.getFileMetadataByETag(
  //       bucketName,
  //       etag
  //     );
  //     return objectInfo;
  //   } catch (error: any) {
  //     console.error('Error retrieving file metadata (manager):', error.message);
  //     throw new Error(`getFileMetadataByETag: ${error}`);
  //   }
  // }

  static async getAllFilesByBucket(
    bucketName: string,
    prefix: string = ''
  ): Promise<SubTypeGroup> {
    try {
      const files = await MinioRepository.getAllFilesByBucket(
        bucketName,
        prefix
      );
      return files;
    } catch (error: any) {
      console.error('Manager Error [getAllFilesByBucket]:', error.message);
      throw new Error('Error in getAllFilesByBucket');
    }
  }

  static async isFileExisted(
    fileName: string,
    bucketName: string
  ): Promise<boolean> {
    try {
      const status = await MinioRepository.isFileExisted(fileName, bucketName);
      return status;
    } catch (error: any) {
      console.error('Manager Error [isFileExisted]:', error.message);
      throw new Error('Error in isFileExisted');
    }
  }

  static async updateMetadata(
    fileName: string,
    bucketName: string,
    meatadata: Partial<Metadata>
  ): Promise<UploadedObjectInfo | null> {
    try {
      const updatedFile = await MinioRepository.updateMetadata(
        fileName,
        bucketName,
        meatadata
      );
      return updatedFile;
    } catch (error: any) {
      console.error('Manager Error [updateMetadata]:', error.message);
      throw new Error('Error in updateMetadata');
    }
  }

  static async deleteFile(
    bucketName: string,
    exerciseType: ExerciseTypes,
    objectName: string
  ): Promise<boolean> {
    try {
      const response = await MinioRepository.deleteFile(
        bucketName,
        exerciseType,
        objectName
      );
      return response;
    } catch (error: any) {
      console.error('Manager Error [deleteFile]:', error.message);
      throw new Error('Error in deleteFile');
    }
  }

  static async createBucket(bucketName: string): Promise<string> {
    try {
      return MinioRepository.createBucket(bucketName);
    } catch (error: any) {
      console.error('Manager Error [createBucket]:', error.message);
      throw new Error('Error in createBucket');
    }
  }

  static async getBucketsList(): Promise<BucketItemFromList[]> {
    try {
      return MinioRepository.getBucketsList();
    } catch (error: any) {
      console.error('Manager Error [getBucketsList]:', error.message);
      throw new Error('Error in getBucketsList');
    }
  }

  static async renameObject(
    bucketName: string,
    oldObjectName: string,
    newObjectName: string
  ): Promise<boolean> {
    try {
      return MinioRepository.renameObject(
        bucketName,
        oldObjectName,
        newObjectName
      );
    } catch (error: any) {
      console.error('Manager Error [renameObject]:', error.message);
      throw new Error('Error in renameObject');
    }
  }
}
