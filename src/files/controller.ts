// controller.ts
import { Request, Response } from "express";
import MinioManager from "./manager.js";

export default class MinioController {
  private manager: MinioManager;

  constructor(bucketName: string) {
    this.manager = new MinioManager(bucketName);
  }

  async uploadFile(req: Request, res: Response) {
    const { objectName, filePath } = req.body;
    try {
      await this.manager.uploadFile(objectName, filePath);
      res.status(200).json({ message: "File uploaded successfully" });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  }

  async getFile(req: Request, res: Response) {
    const objectName = req.params.objectName;
    try {
      const dataStream = await this.manager.getFile(objectName);
      // You can stream the data or handle it in another way
      dataStream.pipe(res);
    } catch (error) {
      res.status(404).json({ error: "File not found" });
    }
  }

  async deleteFile(req: Request, res: Response) {
    const objectName = req.params.objectName;
    try {
      await this.manager.deleteFile(objectName);
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
