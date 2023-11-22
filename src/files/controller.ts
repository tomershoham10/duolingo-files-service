// controller.ts
import { Request, Response } from "express";
import MinioManager from "./manager.js";

export default class MinioController {
  private manager: MinioManager;

  constructor() {
    this.manager = new MinioManager();
  }

  async uploadFile(req: Request, res: Response) {
    const bucketName = req.body.bucketName;
    const objectName = req.body.objectName;
    const filePath = req.body.filePath;
    const metadata = req.body.metadata;
    console.log("files service controller - upload", bucketName, objectName, filePath, metadata);
    this.manager.uploadFile(bucketName, objectName, filePath, metadata).then((etag) => {
      res.status(200).json({ message: `File uploaded successfully: ${etag}` });
    }).catch((error) => {
      console.error('Error:', error);
    });
  }

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
    const bucketName = req.body.bucketName;
    console.log("files service controller - get all files by bucket", bucketName);

    const files = await this.manager.getAllFilesByBucket(bucketName);
    console.log("files service controller - get all files by bucket", files);
    files ?
      res.status(200).json({ files }) :
      res.status(500).json({ error: "Internal server error" });
    ;

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

  async bucketsList(_req: Request, res: Response) {
    try {
      const buckets = await this.manager.bucketsList();
      res.status(200).json({ buckets });
    } catch (error) {
      res.status(500).json({ error: "Failed to list buckets" });
    }
  }
}
