import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "@repo/common";


export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const secret = process.env.JWT_SECRET || "default_secret";
    const payload = verifyToken(token, secret);

    if (!payload) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    // Attach user information to the request object
    req.userId = payload.userId;
    next();
}