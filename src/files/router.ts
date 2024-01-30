import express from "express";
import multer from "multer";
import MinioController from "./controller.js";

const filesRouter = express.Router();
const controller = new MinioController();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

filesRouter
    .get("/download/:bucketName/:objectName", controller.getFileByName.bind(controller))
    .get("/get-files-by-bucket/:bucketName", controller.getAllFilesByBucket.bind(controller))
    .get("/get-sonolist-by-record-id/:recordName", controller.getSonolistByRecordName.bind(controller))
    .get("/isFileExisted/:bucketName/:fileName", controller.isFileExisted.bind(controller))
    .get("/buckets-list", controller.getBucketsList.bind(controller));

filesRouter
    .post("/uploadFile", upload.single('file'), controller.uploadFile.bind(controller))
    .post("/uploadFilesArray", upload.array('file'), controller.uploadFile.bind(controller))
    .post("/create-bucket", controller.createBucket.bind(controller));

filesRouter.delete("/delete/:objectName", controller.deleteFile.bind(controller));

export default filesRouter;
