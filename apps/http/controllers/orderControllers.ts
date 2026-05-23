import { redisManager } from "@repo/redis";
import { createOrderSchema } from "@repo/common";
import type { Request, Response } from "express";



export const createOrder = async (req: Request, res: Response) => {
    const orderId = crypto.randomUUID();

    const {data,success,error} = createOrderSchema.safeParse({
        ...req.body,
        userId: req.userId,
        market: req.params.market,
        orderId
    });

    if (!success) {
        res.status(400).json({ errors: error.issues });
        return;
    }

    try {
        const response = await redisManager.sendOrder(data);
        res.json({
            messafege: "Order created successfully",
            response
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to create order" });
    }
   

}