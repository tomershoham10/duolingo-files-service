import { Router } from "express";
import multer from "multer";
import MinioController from "./controller.js";

const filesRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

filesRouter
    .get("/getFileByName/:bucketName/:exerciseType/:objectName", MinioController.getFileByName)
    .get("/downloadEncryptedZip/:bucketName/:exerciseType/:objectName", MinioController.downloadEncryptedZip)
    .get("/getFileMetadataByName/:bucketName/:exerciseType/:objectName", MinioController.getFileMetadataByName)
    .get("/getFilesByBucketAndType/:bucketName/:exerciseType", MinioController.getAllFilesByBucketAndType)
    .get("/getFilesByBucket/:bucketName", MinioController.getAllFilesByBucket)
    .get("/getMetadataByEtag/:bucketName/:etag", MinioController.getMetadataByETag)
    .get("/isFileExisted/:bucketName/:exerciseType/:fileName", MinioController.isFileExisted)
    .get("/buckets-list", MinioController.getBucketsList);

filesRouter
    .post("/uploadFilesArray", upload.array('file'), MinioController.uploadFilesArray)
    .post("/uploadFile", upload.single('file'), MinioController.uploadFile)
    .post("/create-bucket", MinioController.createBucket);


filesRouter
    .put("/updateMetadata/:bucketName/:fileName", MinioController.updateMetadata)
    .put("/renameObject", MinioController.renameObject);

filesRouter.delete("/delete/:bucketName/:exerciseType/:objectName", MinioController.deleteFile);

export default filesRouter;
