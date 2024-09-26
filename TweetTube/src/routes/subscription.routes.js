import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js"
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controllers.js";

const router = Router();

router.use(verifyJWT);

router.route('/toggle-subscription/:channelId').get(toggleSubscription)
router.route('/get-all-subscribers/:channelId').get(getUserChannelSubscribers)
router.route('/get-all-subscribed-to-channels/:channelId').get(getSubscribedChannels)

export default router