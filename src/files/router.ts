import { Router } from "express";
import multer from "multer";
import MinioController from "./controller.js";

const filesRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

filesRouter
    .get("/download/:bucketName/:exerciseType/:objectName", MinioController.getFileByName)
    .get("/downloadEncryptedZip/:bucketName/:exerciseType/:objectName", MinioController.downloadEncryptedZip)
    .get("/getFileByName/:bucketName/:exerciseType/:objectName", MinioController.getFileByName)
    .get("/get-files-by-bucket/:bucketName", MinioController.getAllFilesByBucket)
    .get("/get-metadata-by-etag/:bucketName/:etag", MinioController.getMetadataByETag)
    .get("/isFileExisted/:bucketName/:exerciseType/:fileName", MinioController.isFileExisted)
    .get("/buckets-list", MinioController.getBucketsList);

filesRouter
    .post("/uploadFile", upload.single('file'), MinioController.uploadFile)
    .post("/uploadFilesArray", upload.array('file'), MinioController.uploadFile)
    .post("/create-bucket", MinioController.createBucket);


filesRouter
    .put("/updateMetadata/:bucketName/:fileName", MinioController.updateMetadata)
    .put("/renameObject", MinioController.renameObject);

filesRouter.delete("/delete/:objectName", MinioController.deleteFile);

export default filesRouter;
