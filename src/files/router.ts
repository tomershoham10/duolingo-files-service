import express from "express";
import MinioController from "./controller.js";

const filesRouter = express.Router();
const controller = new MinioController();

filesRouter.post("/upload", controller.uploadFile.bind(controller));
filesRouter.get("/download/:objectName", controller.getFileByName.bind(controller));
filesRouter.delete("/delete/:objectName", controller.deleteFile.bind(controller));
filesRouter.post("/create-bucket", controller.createBucket.bind(controller));
filesRouter.get("/buckets-list", controller.bucketsList.bind(controller));
filesRouter.get("/get-files-by-bucket", controller.getAllFilesByBucket.bind(controller));

export default filesRouter;
