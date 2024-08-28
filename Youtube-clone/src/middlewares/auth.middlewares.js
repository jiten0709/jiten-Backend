import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyscHandler.js";
import jwt from 'jsonwebtoken'
import { User } from "../models/user.models.js";

const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '')
        if (!token) {
            throw new ApiError(401, 'auth.middlewares :: Unauthorized request')
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        if (!user) {
            throw new ApiError(401, 'auth.middlewares :: Invalid access token')
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, `auth.middlewares :: ${error?.message}` || 'auth.middlewares :: Invalid access token')
    }
})

export { verifyJWT }
