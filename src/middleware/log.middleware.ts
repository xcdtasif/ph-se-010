import type { NextFunction, Request, Response } from "express";
import fs from "fs";

const addLog = (req: Request, res: Response, next: NextFunction) => {
  // console.log("Method - URL - Time:", req.method, req.url, Date.now());

  const log = `[${new Date().toISOString()}] method=${req.method} url=${req.url} ip=${req.ip}\n\n`;

  fs.appendFile("logger.txt", log, (err) => {
    if (err) {
      console.error("Logger error:", err);
    }
  });

  next();
};

export default addLog;
