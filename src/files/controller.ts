// controller.ts
import { Request, Response } from "express";
import MinioManager from "./manager.js";
import { RecordMetadata, SonogramMetadata } from "./model.js";
import { stringify } from 'flatted';

export default class MinioController {
  private manager: MinioManager;

  constructor() {
    this.manager = new MinioManager();
  }
  async uploadFile(req: Request, res: Response) {
    try {
      console.log("controller - uploadFile", req.file, "controller - uploadFile body", req.body);
      const bucketName: string = req.body.bucketName;
      const metadataString: string = req.body.metadata;
      const metadata: Partial<RecordMetadata> | Partial<SonogramMetadata> = JSON.parse(metadataString);
      console.log('controller - uploadFile - metadata', metadataString, metadata)
      const files: Express.Multer.File[] | Express.Multer.File | { [fieldname: string]: Express.Multer.File[]; } | undefined = req.files || req.file;
      if (!files) {
        return res.status(400).json({ success: false, message: 'No files provided.' });
      }

      if (Array.isArray(files)) {
        // Handle multiple files
        const uploadPromises = files.map(async (file) => {
          return this.manager.uploadFile(bucketName, metadata, file);
        });

        const results = await Promise.all(uploadPromises);
        console.log('controller - uploadFile - Multiple files uploaded successfully:', results);
        res.status(200).json({ success: true, message: 'Files uploaded successfully.', uploadedData: results });
      } else {
        // Handle single file
        const result = await this.manager.uploadFile(bucketName, metadata, files);
        console.log('controller - uploadFile - Single file uploaded successfully:', result);
        res.status(200).json({ success: true, message: 'Files uploaded successfully.', uploadedData: result });
      }

    }
    catch (error: any) {
      console.error('Controller uploadFile Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async getFileByName(req: Request, res: Response): Promise<void> {
    try {
      const bucketName = req.params.bucketName;
      const objectName = req.params.objectName;
      const objectData = await this.manager.getFileByName(bucketName, objectName);
      const imageStream = objectData.stream;
      const metaData = objectData.metadata;
      console.log('controller - getimage', imageStream);
      res.setHeader('metaData', JSON.stringify(metaData));

      // Pipe the image stream to the response
      imageStream.pipe(res);
    } catch (error) {
      console.error('Error fetching image:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  };

  async getMetadataByETag(req: Request, res: Response) {
    const bucketName = req.params.bucketName;
    const etag = req.params.etag;

    try {
      const objectInfo = await this.manager.getFileMetadataByETag(bucketName, etag);

      if (!!objectInfo) {

        res.status(200).json(objectInfo);
      } else {
        res.status(404).json({ error: "File not found" });
      }
    } catch (error: any) {
      console.error('Controller getMetadataByETag Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async getAllFilesByBucket(req: Request, res: Response) {
    try {
      const bucketName = req.params.bucketName;
      console.log("files service controller - get all files by bucket", bucketName);

      const files = await this.manager.getAllFilesByBucket(bucketName);
      console.log("files service controller - get all files by bucket", files);
      files ?
        res.status(200).json({ files }) :
        res.status(500).json({ error: "Internal server error" });
      ;
    } catch (error: any) {
      console.error('Controller getAllFilesByBucket Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async getSonolistNamesByRecordName(req: Request, res: Response) {
    try {
      const recordName = req.params.recordName;
      console.log("files service controller - getSonolistNamesByRecordName recordName", recordName);

      const sonograms = await this.manager.getSonolistNamesByRecordName(recordName);
      console.log("files service controller - getSonolistNamesByRecordName sonograms", sonograms);
      (sonograms.length <= 0)
        ? res.status(404).json({ error: "no sonograms" })
        : res.status(200).json({ sonograms });

      // Close response stream when all files are streamed
      res.on('finish', () => {
        console.log('All files streamed');
      });

      // fileStreams.forEach(fileStream => {
      //   fileStream.pipe(res, { end: false });
      // });
      // // Close the response stream when all file streams are piped
      // Promise.all(fileStreams.map(stream => new Promise(resolve => stream.on('end', resolve)))).then(() => {
      //   res.end();
      // });

    } catch (error: any) {
      console.error('Controller getSonolistByRecordName Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async isFileExisted(req: Request, res: Response) {
    try {
      const fileName = req.params.fileName;
      const bucketName = req.params.bucketName;
      console.log("files service controller - isFileExisted", fileName, bucketName);

      const status = await this.manager.isFileExisted(fileName, bucketName);
      console.log("files service controller -isFileExisted status", status);
      res.status(200).json({ status });
    } catch (error: any) {
      console.error('Controller isFileExisted Error:', error, "massage: ", error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async updateMetadata(req: Request, res: Response) {
    const fileName = req.params.fileName;
    const bucketName = req.params.bucketName;
    const newMeata = req.body.metadata;
    try {
      const file = await this.manager.updateMetadata(fileName, bucketName, newMeata);
      console.log("files service controller -updateMetadata updated file", file);
      res.status(200).json({ file });
    } catch (error: any) {
      console.error('Controller updateMetadata Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async deleteFile(req: Request, res: Response) {
    const bucketName = req.body.bucketName;
    const objectName = req.body.objectName;
    try {
      await this.manager.deleteFile(bucketName, objectName);
      res.status(200).json({ message: "File deleted successfully" });
    } catch (error: any) {
      console.error('Controller deleteFile Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async createBucket(req: Request, res: Response) {
    const bucketName = req.body.bucketName;
    console.log("new bucket request:", req.body, bucketName);
    try {
      await this.manager.createBucket(bucketName);
      res.status(201).json({ message: "Bucket created successfully" });
    } catch (error: any) {
      console.error('Controller createBucket Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async getBucketsList(_req: Request, res: Response) {
    try {
      const buckets = await this.manager.getBucketsList();
      res.status(200).json({ buckets });
    } catch (error: any) {
      console.error('Controller getBucketsList Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }

  async renameObject(req: Request, res: Response) {
    try {
      const bucketName = req.body.bucketName;
      const oldObjectName = req.body.oldObjectName;
      const newObjectName = req.body.newObjectName;
      const status = await this.manager.renameObject(bucketName, oldObjectName, newObjectName);

      status ? res.status(200).json({ message: "object was renamed successfully." }) : res.status(404).json({ message: "object was not found." });
    } catch (error: any) {
      console.error('Controller renameObject Error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
}
