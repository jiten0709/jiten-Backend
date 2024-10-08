import { Router } from "express";
import { upload } from '../middlewares/multer.middlewares.js'
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatarWithTodo,
    updateUserCoverImageWithTodo,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controllers.js";

const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser)

// secured routes
router.route('/current-user').get(verifyJWT, getCurrentUser)
router.route('/channel/:username').get(verifyJWT, getUserChannelProfile)
router.route('/history').get(verifyJWT, getWatchHistory)
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/change-password').post(verifyJWT, changeCurrentPassword)
router.route('/update-account').patch(verifyJWT, updateAccountDetails)
router.route('/avatar').patch(verifyJWT, upload.single('avatar'), updateUserAvatarWithTodo)
router.route('/cover-image').patch(verifyJWT, upload.single('coverImage'), updateUserCoverImageWithTodo)

export default router