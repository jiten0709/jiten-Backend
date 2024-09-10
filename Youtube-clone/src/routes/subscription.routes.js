import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js";

const router = Router();

router.use(verifyJWT);

router.route('/toggle-subscription/:channelId').get(toggleSubscription)
router.route('/get-all-subscribers/:channelId').get(getUserChannelSubscribers)
router.route('/get-all-subscribed-to-channels/:channelId').get(getSubscribedChannels)

export default router