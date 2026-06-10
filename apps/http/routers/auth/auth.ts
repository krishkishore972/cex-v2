import { Router } from "express";
import { signUp } from "../../controllers/auth/signUp";
import { signIn } from "../../controllers/auth/signIn";


const router = Router();

router.post("/signup", signUp);
router.post("/signin", signIn);

export default router;
