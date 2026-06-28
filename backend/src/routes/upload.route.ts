import { Router } from "express";

import auth from "../middlewares/auth.middleware.js";

import upload from "../utils/upload.util.js";

import {
  uploadImage,
} from "../controllers/upload.controller.js";

const router = Router();

router.post(
  "/",
  auth,
  upload.single("image"),
  uploadImage
);

export default router;