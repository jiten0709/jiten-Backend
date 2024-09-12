import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
} from '../controllers/likes.controllers.js'

const router = Router()

router.use(verifyJWT)

router.route('/toggle-video-like/:videoId').patch(toggleVideoLike)
router.route('/toggle-comment-like/:videoId').patch(toggleCommentLike)
router.route('/toggle-tweet-like/:videoId').patch(toggleTweetLike)
router.route('/videos').get(getLikedVideos)

export default router