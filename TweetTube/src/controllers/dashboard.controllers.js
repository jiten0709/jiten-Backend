import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Video } from '../models/video.models.js'
import { Subscription } from '../models/subscription.models.js'

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString()

    const [videoStats] = await Video.aggregate([
        { $match: { owner: userId } },
        {
            $group: {
                _id: null,
                totalViews: { $sum: '$views' },
                totalVideos: { $sum: 1 },
                totalLikes: { $sum: '$likedBy' }
            }
        }
    ])

    const totalViews = videoStats ? videoStats.totalViews : 0
    const totalVideos = videoStats ? videoStats.totalVideos : 0
    const totalLikes = videoStats ? videoStats.totalLikes : 0
    const totalSubscribers = await Subscription.countDocuments({ channel: userId })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { totalVideos, totalViews, totalSubscribers, totalLikes },
            "dashboard.controllers.js :: Dashboard data fetched successfully"
        ))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString()
    const videos = await Video.find({ owner: userId })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            videos,
            "dashboard.controllers.js :: Channel videos fetched successfully"
        ))
})

export { getChannelStats, getChannelVideos }