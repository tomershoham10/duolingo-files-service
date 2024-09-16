import { Router } from 'express';
import multer from 'multer';
import MinioController from './controller.js';

const filesRouter = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

filesRouter
  .get(
    '/getFileByName/:mainId/:subtypeId/:modelId/:fileType/:objectName',
    MinioController.getFileByName
  )
  .get(
    '/downloadEncryptedZip/:mainId/:subtypeId/:modelId/:fileType/:objectName',
    MinioController.downloadEncryptedZip
  )
  .get(
    '/getFileMetadataByName/:mainId/:subtypeId/:modelId/:fileType/:objectName',
    MinioController.getFileMetadataByName
  )
  // .get(
  //   '/getFilesByBucketAndType/:bucketName/:exerciseType',
  //   MinioController.getAllFilesByBucketAndType
  // )
  // .get(
  //   '/getModelIdFiles/:mainId/:subtypeId/:modelId',
  //   MinioController.getModelIdFiles
  // )
  .get('/getFilesByBucket/:mainId/:subtypeId?/:modelId?/:fileType?', MinioController.getAllFilesByBucket)
  // .get(
  //   '/getMetadataByEtag/:bucketName/:etag',
  //   MinioController.getMetadataByETag
  // )
  .get(
    '/isFileExisted/:bucketName/:exerciseType/:fileName',
    MinioController.isFileExisted
  )
  .get('/buckets-list', MinioController.getBucketsList);

filesRouter
  .post(
    '/uploadFilesArray',
    upload.array('files', 10),
    MinioController.uploadFilesArray
  )
  .post('/uploadFile', upload.single('file'), MinioController.uploadFile)
  .post('/create-bucket', MinioController.createBucket);

filesRouter
  .put('/updateMetadata/:bucketName/:fileName', MinioController.updateMetadata)
  .put('/renameObject', MinioController.renameObject);

filesRouter.delete(
  '/delete/:bucketName/:exerciseType/:objectName',
  MinioController.deleteFile
);

export default filesRouter;
