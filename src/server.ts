import express from "express";
import cors from "cors";
import multer from "multer";
import bodyParser from "body-parser";
import router from "./router.js";
import config from "./utils/config.js";

import { Client } from "minio";
import { errorHandler } from "./middleware/errorHandler.js";
import { Express } from "express-serve-static-core";

const startServer = () => {
  const port = config.http.port;
  const app = express();
  configureMiddlewares(app);
  app.use(router);

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};

const configureMiddlewares = (app: Express) => {
  const storage = multer.memoryStorage(); // Use memory storage for simplicity; adjust as needed
  // const upload = multer({ storage: storage });
  // const storage = multer.memoryStorage();
  // const limits = {
  //   fileSize: 50000000, // Adjust file size limit as needed
  // };
  // const upload = multer({
  //   storage: storage,
  //   limits: limits,
  // });
  app.use(
    cors({
      origin: ["http://localhost:3000", "blob:"],
      credentials: true,
      exposedHeaders: ["Authorization"],
    })
  );
  app.use(bodyParser.json({ limit: '200mb' }));
  app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // app.use(errorHandler);


  // app.post('/api/files/upload', upload.single('file'), async (req, res, next) => {
  //   const file = req.file;
  //   if (!file) {
  //     return res.status(400).json({ error: 'No file uploaded' });
  //   }

  //   try {
  //     await minioClient.putObject('your-bucket-name', file.originalname, file.buffer, file.size);
  //     res.status(200).json({ message: 'File uploaded successfully' });
  //   } catch (error) {
  //     console.error('Error uploading to Minio:', error);
  //     res.status(500).json({ error: 'Internal server error' });
  //   }
  // });
};


const minioClient = new Client({
  endPoint: "server-minio-1", // Replace with your MinIO server hostname
  port: 9000, // MinIO server port
  useSSL: false, // Set to true if you want to use SSL
  accessKey: "your-minio-access-key", // Your MinIO access key
  secretKey: "your-minio-secret-key", // Your MinIO secret key
});

export { minioClient };
export default startServer;
