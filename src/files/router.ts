import express from "express";
import MinioController from "./controller.js";

const filesRouter = express.Router();
const controller = new MinioController();

filesRouter
    .get("/download/:objectName", controller.getFileByName.bind(controller))
    .get("/get-files-by-bucket", controller.getAllFilesByBucket.bind(controller))
    .get("/buckets-list", controller.bucketsList.bind(controller));

filesRouter
    .post("/upload", controller.uploadFile.bind(controller))
    .post("/create-bucket", controller.createBucket.bind(controller));

filesRouter.delete("/delete/:objectName", controller.deleteFile.bind(controller));

export default filesRouter;
