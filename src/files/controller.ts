// controller.ts
import { Request, Response } from "express";
import MinioManager from "./manager.js";

export default class MinioController {
  private manager: MinioManager;

  constructor() {
    this.manager = new MinioManager();
  }
  async uploadFile(req: Request, res: Response) {
    try {
      console.log("controller - uploadFile", req.file, "controller - uploadFile body", req.body);
      const bucketName: string = req.body.bucketName;
      const metadata: string = req.body.metadata;
      const files: Express.Multer.File[] | Express.Multer.File | { [fieldname: string]: Express.Multer.File[]; } | undefined = req.files || req.file;
      if (!files) {
        return res.status(400).json({ success: false, message: 'No files provided.' });
      }
      if (Array.isArray(files)) {
        // Handle multiple files
        const uploadPromises = files.map(async (file) => {
          return this.manager.uploadFile(bucketName, file);
        });

        const results = await Promise.all(uploadPromises);
        console.log('controller - uploadFile - Multiple files uploaded successfully:', results);
        res.status(200).json({ success: true, message: 'Files uploaded successfully.', uploadedData: results });
      } else {
        // Handle single file
        const result = await this.manager.uploadFile(bucketName, files);
        console.log('controller - uploadFile - Single file uploaded successfully:', result);
        res.status(200).json({ success: true, message: 'Files uploaded successfully.', uploadedData: result });
      }

    }
    catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Error uploading file' });
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
    const bucketName = req.body.bucketName;
    const objectName = req.body.objectName;

    try {
      const fileData = await this.manager.getFileByName(bucketName, objectName);

      if (fileData) {
        res.setHeader('Content-Type', 'application/octet-stream');

        res.send(fileData);
      } else {
        res.status(404).json({ error: "File not found" });
      }
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getAllFilesByBucket(req: Request, res: Response) {
    try {
      const bucketName = req.body.bucketName;
      console.log("files service controller - get all files by bucket", bucketName);

      const files = await this.manager.getAllFilesByBucket(bucketName);
      console.log("files service controller - get all files by bucket", files);
      files ?
        res.status(200).json({ files }) :
        res.status(500).json({ error: "Internal server error" });
      ;
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async deleteFile(req: Request, res: Response) {
    const bucketName = req.body.bucketName;
    const objectName = req.body.objectName;
    try {
      await this.manager.deleteFile(bucketName, objectName);
      res.status(200).json({ message: "File deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async createBucket(req: Request, res: Response) {
    const bucketName = req.body.bucketName;
    console.log("new bucket request:", req.body, bucketName);
    try {
      await this.manager.createBucket(bucketName);
      res.status(201).json({ message: "Bucket created successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to create bucket" });
    }
  }

  async getBucketsList(_req: Request, res: Response) {
    try {
      const buckets = await this.manager.getBucketsList();
      res.status(200).json({ buckets });
    } catch (error) {
      res.status(500).json({ error: "Failed to list buckets" });
    }
  }
}
