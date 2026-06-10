import z, { email, symbol, type ZodError } from "zod";
import { sign, verify, type JwtPayload } from "jsonwebtoken";

export const zodErrorFormatter = (error: ZodError) => {
    return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("\n");
};

export const signupSchema = z.object({
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    username: z.string().min(5, "Username must be at least 5 characters long").max(100, "Username must be at most 100 characters long").optional(),
})

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
})

export const createOrderSchema = z.object({
    side: z.enum(["buy", "sell"]),
    type: z.enum(["limit", "market"]),
    symbol: z.string().includes("/"),
    price: z.number().positive().optional(),
    qty: z.number().positive(),
    userId: z.uuid(),
    orderId:z.uuid(),
    // market:z.enum(["spot", "futures"]),
})

export const generateToken = (userId: string, secret: string) => {
    return sign({ userId }, secret, { expiresIn: "1h" });
}

export const verifyToken = (token: string, secret: string): JwtPayload | null => {
    try {
        return verify(token, secret) as JwtPayload;
    } catch (error) {
        console.error("Token verification failed:", error);
        return null;
    }
}
