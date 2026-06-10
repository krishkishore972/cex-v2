import { signupSchema, zodErrorFormatter } from "@repo/common";
import { prisma } from "@repo/db";
import type { Request, Response } from "express";
import bcrypt from "bcrypt";



export async function signUp(req: Request, res: Response) {

    const {success, data, error} = signupSchema.safeParse(req.body);
    
    if (!success) {
        return res.status(400).json({
            message: "Invalid request data",
            errors: zodErrorFormatter(error)
        });
    }
    try {

        const existingUser = await prisma.user.findUnique({
            where: {
                email: data.email
            }
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email already in use"
            });
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);
        const username = data.email.split("@")[0]!; // Simple username generation from email, can be improved
        const newUser = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                username: username
            }
        });
        
        res.status(201).json({
            message: "User created successfully",
            userId: newUser.id
        });       
        
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        });
    }
}