// controller.ts
import { Request, Response } from "express";
import MinioManager from "./manager.js";
import { RecordMetadata, SonogramMetadata } from "./model.js";

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
  // async uploadFile(req: Request, res: Response) {
  //   try {

  //     const bucketName = req.body.bucketName;
  //     const file = req.body.file;
  //     const metadata = req.body.metadata;
  //     console.log("files service controller - upload", bucketName, file, metadata);
  //     this.manager.uploadFile(bucketName, file, metadata).then((etag) => {
  //       res.status(200).json({ message: `File uploaded successfully: ${etag}` });
  //     }).catch((error) => {
  //       console.error('Error:', error);
  //     });
  //   } catch (error) {
  //     res.status(500).json({ error: "Internal server error" });
  //   }
  // }

  async getFileByName(req: Request, res: Response) {
    const bucketName = req.params.bucketName;
    const objectName = req.params.objectName;

    try {
      const fileData = await this.manager.getFileByName(bucketName, objectName);

      if (fileData) {
        res.setHeader('Content-Type', 'application/octet-stream');

        res.send(fileData);
      } else {
        res.status(404).json({ error: "File not found" });
      }
    } catch (error: any) {
      console.error('Controller getFileByName Error:', error.message);
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

  async getSonolistByRecordName(req: Request, res: Response) {
    try {
      const recordName = req.params.recordName;
      console.log("files service controller - getSonolistByRecordName", recordName);

      const files = await this.manager.getSonolistByRecordName(recordName);
      console.log("files service controller - getSonolistByRecordName", files);
      files ?
        res.status(200).json({ files }) :
        res.status(500).json({ error: "Internal server error" });
      ;
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
}
