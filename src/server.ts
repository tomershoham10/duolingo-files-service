import express from "express";
import cors from "cors";
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
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
      exposedHeaders: ["Authorization"],
    })
  );
  app.use(bodyParser.json());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(errorHandler);
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
