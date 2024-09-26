import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { healthcheck } from "../controllers/healthcheck.controllers.js"

const router = Router();

router.use(verifyJWT);

router.route('/').get(healthcheck);

export default router;