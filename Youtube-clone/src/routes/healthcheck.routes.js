import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares";
import { healthcheck } from "../controllers/healthcheck.controller"

const router = Router();

router.use(verifyJWT);

router.route('/').get(healthcheck);

export default router;