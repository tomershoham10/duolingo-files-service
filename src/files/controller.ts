import axios from 'axios';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import MinioManager from './manager.js';
import { ExerciseTypes, Metadata } from './model.js';
import FormData from 'form-data';
import dotenv from 'dotenv';
dotenv.config();
const passwordKey = process.env.PASSWORD_KEY || 'password';

export default class MinioController {
  static async getFileByName(req: Request, res: Response): Promise<void> {
    try {
      const { bucketName, exerciseType, objectName } = req.params as {
        bucketName: string;
        exerciseType: ExerciseTypes;
        objectName: string;
      };
      // const bucketName = req.params.bucketName;
      // const objectName = req.params.objectName;
      const objectData = await MinioManager.getFileByName(
        bucketName,
        exerciseType,
        objectName
      );
      const imageStream = objectData.stream;
      const metaData = objectData.metadata;
      console.log('controller - getimage', imageStream);
      res.setHeader('metaData', JSON.stringify(metaData));

      // Pipe the image stream to the response
      imageStream.pipe(res);
    } catch (error) {
      console.error('Error fetching image (controller):', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async uploadFile(req: Request, res: Response) {
    try {
      console.log(
        'controller - uploadFile',
        req.file,
        'controller - uploadFile body',
        req.body
      );
      const { bucketName, metadata, exerciseType } = req.body;
      const metadataObj: Partial<Metadata> = JSON.parse(metadata);
      console.log('controller - uploadFile - metadata', metadataObj, metadata);
      const file: Express.Multer.File | undefined = req.file;
      if (!file) {
        return res
          .status(400)
          .json({ success: false, message: 'File was not provided.' });
      }
      const result = await MinioManager.uploadFile(
        bucketName,
        exerciseType,
        metadataObj,
        file
      );
      console.log(
        'controller - uploadFile - Single file uploaded successfully:',
        result
      );
      if (res === null) {
        throw new Error('error while uploading file');
      } else {
        res.status(200).json({
          success: true,
          message: 'Files uploaded successfully.',
          uploadedData: result,
        });
      }
    } catch (error: any) {
      console.error('Controller uploadFile Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async uploadFilesArray(req: Request, res: Response) {
    try {
      console.log(
        'controller - uploadFile',
        req.file,
        'controller - uploadFile body',
        req.body
      );
      const { bucketName, metadataString, exerciseType } = req.body;
      const metadata: Partial<Metadata> = JSON.parse(metadataString);
      const files:
        | Express.Multer.File[]
        | { [fieldname: string]: Express.Multer.File[] }
        | undefined = req.files;
      if (!files || !Array.isArray(files)) {
        return res
          .status(400)
          .json({ success: false, message: 'No files provided.' });
      }
      const uploadPromises = files.map(async (file) => {
        return MinioManager.uploadFile(
          bucketName,
          exerciseType,
          metadata,
          file
        );
      });

      const results = await Promise.all(uploadPromises);
      console.log(
        'controller - uploadFile - Multiple files uploaded successfully:',
        results
      );
      res.status(200).json({
        success: true,
        message: 'Files uploaded successfully.',
        uploadedData: results,
      });
    } catch (error: any) {
      console.error('Controller uploadFile Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async getFileMetadataByName(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { bucketName, exerciseType, objectName } = req.params as {
        bucketName: string;
        exerciseType: ExerciseTypes;
        objectName: string;
      };
      // const bucketName = req.params.bucketName;
      // const objectName = req.params.objectName;
      const metaData = await MinioManager.getFileMetadataByName(
        bucketName,
        exerciseType,
        objectName
      );
      console.log('controller - getFileMetadataByName', metaData);

      // Pipe the image stream to the response
      res
        .status(200)
        .json({ message: `${objectName} metadata`, metaData: metaData });
    } catch (error) {
      console.error('Error fetching image (controller):', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async downloadEncryptedZip(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const pythonServiceUrl =
        process.env.PYTHON_SERVICE_URL ||
        'http://zips-encrypting-service:5000/api/encrypt-zip/upload';
      const authServiceUrl =
        process.env.AUTH_SERVICE_URL ||
        'http://authentication-service:4000/api/auth/getRecordZipPassword';

      const { bucketName, exerciseType, objectName } = req.params as {
        bucketName: string;
        exerciseType: ExerciseTypes;
        objectName: string;
      };

      const objectData = await MinioManager.getFileByName(
        bucketName,
        exerciseType,
        objectName
      );
      const imageStream = objectData.stream;
      const metaData = objectData.metadata;

      const zipPasswordResponse = await axios.get(
        `${authServiceUrl}/${objectName}`
      );
      const zipPassword = zipPasswordResponse.data?.zipPassword;

      const encryptedMetadata = jwt.sign(
        { ...metaData, zipPassword: zipPassword },
        passwordKey,
        {
          expiresIn: '10m',
        }
      );

      res.setHeader('metadata', encryptedMetadata);
      const form = new FormData();

      form.append('file', imageStream, { filename: objectName });

      form.append('metadata', JSON.stringify(metaData));

      form.append('zipPassword', JSON.stringify(zipPassword));

      const response = await axios.post(pythonServiceUrl, form, {
        headers: {
          ...form.getHeaders(),
        },
        responseType: 'stream', // Specify response type as 'stream' to handle binary data as a stream
      });

      // Check if the response status is OK
      if (response.status !== 200) {
        res.status(response.status).json({ error: 'Failed to download file' });
        return;
      }

      // Set the appropriate headers for the zip file
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=output.zip');

      // Pipe the response stream directly to the client
      response.data.pipe(res);

      // res.status(200).json({ message: 'File sent to Python service successfully' });
    } catch (error: any) {
      console.error(
        'Error fetching image (downloadEncryptedZip):',
        error.message
      );
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMetadataByETag(req: Request, res: Response) {
    const { bucketName, etag } = req.params as {
      bucketName: string;
      etag: string;
    };
    // const bucketName = req.params.bucketName;
    // const etag = req.params.etag;

    try {
      const objectInfo = await MinioManager.getFileMetadataByETag(
        bucketName,
        etag
      );

      if (objectInfo) {
        res.status(200).json(objectInfo);
      } else {
        res.status(404).json({ error: 'File not found' });
      }
    } catch (error: any) {
      console.error('Controller getMetadataByETag Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAllFilesByBucket(req: Request, res: Response) {
    try {
      const bucketName = req.params.bucketName;
      console.log(
        'files service controller - get all files by bucket',
        bucketName
      );

      const files = await MinioManager.getAllFilesByBucket(bucketName);
      console.log('files service controller - get all files by bucket', files);
      files
        ? res.status(200).json({ files })
        : res.status(500).json({ error: 'Internal server error' });
    } catch (error: any) {
      console.error('Controller getAllFilesByBucket Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async getAllFilesByBucketAndType(req: Request, res: Response) {
    try {
      const { bucketName, exerciseType } = req.params;
      console.log(
        'files service controller - get all files by bucket and type',
        bucketName,
        exerciseType
      );

      const files = await MinioManager.getAllFilesByBucket(
        bucketName,
        exerciseType
      );
      console.log('files service controller - get all files by bucket', files);
      files
        ? res.status(200).json({ files })
        : res.status(500).json({ error: 'Internal server error' });
    } catch (error: any) {
      console.error('Controller getAllFilesByBucket Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async isFileExisted(req: Request, res: Response) {
    try {
      const fileName = req.params.fileName;
      const bucketName = req.params.bucketName;
      console.log(
        'files service controller - isFileExisted',
        fileName,
        bucketName
      );

      const status = await MinioManager.isFileExisted(fileName, bucketName);
      console.log('files service controller -isFileExisted status', status);
      res.status(200).json({ status });
    } catch (error: any) {
      console.error(
        'Controller isFileExisted Error:',
        error,
        'massage: ',
        error.message
      );
      res.status(500).json({ error: error.message });
    }
  }

  static async updateMetadata(req: Request, res: Response) {
    const fileName = req.params.fileName;
    const bucketName = req.params.bucketName;
    const newMeata = req.body.metadata;
    try {
      const file = await MinioManager.updateMetadata(
        fileName,
        bucketName,
        newMeata
      );
      console.log(
        'files service controller -updateMetadata updated file',
        file
      );
      res.status(200).json({ file });
    } catch (error: any) {
      console.error('Controller updateMetadata Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteFile(req: Request, res: Response) {
    const { bucketName, exerciseType, objectName } = req.params as {
      bucketName: string;
      exerciseType: ExerciseTypes;
      objectName: string;
    };
    try {
      await MinioManager.deleteFile(bucketName, exerciseType, objectName);
      res.status(200).json({ message: 'File deleted successfully' });
    } catch (error: any) {
      console.error('Controller deleteFile Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async createBucket(req: Request, res: Response) {
    const bucketName = req.body.bucketName;
    console.log('new bucket request:', req.body, bucketName);
    try {
      await MinioManager.createBucket(bucketName);
      res.status(201).json({ message: 'Bucket created successfully' });
    } catch (error: any) {
      console.error('Controller createBucket Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async getBucketsList(_req: Request, res: Response) {
    try {
      const buckets = await MinioManager.getBucketsList();
      res.status(200).json({ buckets });
    } catch (error: any) {
      console.error('Controller getBucketsList Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  static async renameObject(req: Request, res: Response) {
    try {
      const bucketName = req.body.bucketName;
      const oldObjectName = req.body.oldObjectName;
      const newObjectName = req.body.newObjectName;
      const status = await MinioManager.renameObject(
        bucketName,
        oldObjectName,
        newObjectName
      );

      status
        ? res.status(200).json({ message: 'object was renamed successfully.' })
        : res.status(404).json({ message: 'object was not found.' });
    } catch (error: any) {
      console.error('Controller renameObject Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
}
