import type { Request, Response } from "express";
import {prisma} from "@repo/db";
import {compare} from "bcrypt";
import {generateToken, loginSchema,zodErrorFormatter} from "@repo/common";

export async function signIn(req: Request, res: Response) {
    const {success, data, error} = loginSchema.safeParse(req.body);

    if (!success) {
        return res.status(400).json({
            message: "Invalid request data",
            errors: zodErrorFormatter(error)
        });
    }

    // Further logic for handling valid login credentials would go here
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: data.email
            }
        });
        
        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        const passwordMatch = await compare(data.password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }
        
        const token = generateToken(user.id, process.env.JWT_SECRET as string);

        res.status(200).json({
            message: "Login successful",
            token
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error"
        });
    }
}