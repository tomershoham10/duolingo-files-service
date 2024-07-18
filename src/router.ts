import { Router, Request, Response } from 'express';
import filesRouter from './files/router.js';

const router = Router();
// const requestLoggerMiddleware: express.RequestHandler = (
//   req: express.Request,
//   _res: express.Response,
//   next: express.NextFunction
// ) => {
//   const timestamp = new Date().toISOString();
//   console.log(`${timestamp}: ${req.method} ${req.url}`);
//   console.log('Request Headers:', req.headers);
//   console.log('Request Body:', req.body);
//   next();
// };
// router.use(requestLoggerMiddleware);

router.get('/health', (_req: Request, res: Response) => {
  console.log('health');
  res.status(200).send('Alive');
});

router.use('/api/files/', filesRouter);

export default router;
