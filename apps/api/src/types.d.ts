import "express";

declare global {
  namespace Express {
    interface Request {
      // user?: any;
      // files?: any;
      rawBody?: Buffer;
    }
  }
}
