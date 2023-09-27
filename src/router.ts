import express, { Router } from "express";
import Express from "express";
// import userRouter from "./users/router.js";

const router: Router = express.Router();

router.get("/health", (_req: Express.Request, res: Express.Response) => {
  console.log("health");
  res.status(200).send("Alive");
});

// router.use("/api/users/", userRouter);

export default router;
