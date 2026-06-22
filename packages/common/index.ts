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



export const CREATE_ORDER = "CREATE_ORDER";
export const CANCEL_ORDER = "CANCEL_ORDER";
export const ON_RAMP = "ON_RAMP";

export const GET_DEPTH = "GET_DEPTH";
export const GET_OPEN_ORDERS = "GET_OPEN_ORDERS";


//TODO: Can we share the types between the api and the engine?
export type MessageFromApi = {
    type: typeof CREATE_ORDER,
    data: {
        market: string,
        price: string,
        quantity: string,
        side: "buy" | "sell",
        userId: string,
        orderId:string,
    }
} | {
    type: typeof CANCEL_ORDER,
    data: {
        orderId: string,
        market: string,
    }
} | {
    type: typeof ON_RAMP,
    data: {
        amount: string,
        userId: string,
        txnId: string
    }
} | {
    type: typeof GET_DEPTH,
    data: {
        market: string,
    }
} | {
    type: typeof GET_OPEN_ORDERS,
    data: {
        userId: string,
        market: string,
    }
}
