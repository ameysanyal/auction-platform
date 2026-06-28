import { Router } from "express";

import auth from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema } from "../validators/auth.validator.js";

import { register, login, me , logout, adminSignUp} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", validate(registerSchema), register);

router.post("/login", login);

router.get("/me", auth, me);

router.post(
  "/logout",
  auth,
  logout
);

router.post("/signup", adminSignUp)

export default router;

