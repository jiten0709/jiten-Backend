import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { validateObjectId } from "../utils/validateObjectId.js"
import { checkOwnership } from "../utils/checkOwnership.js"

const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query
    const parsedPage = parseInt(page)
    const parsedLimit = parseInt(limit)
    const offset = parsedPage * parsedLimit - parsedLimit
    const sortOptions = { [sortBy]: sortType === 'asc' ? 1 : -1 }
    const filter = query ? { title: { $regex: query, $options: 'i' } } : {}

    try {
        const [list, totalVideos] = await Promise.all([
            Video.find(filter)
                .sort(sortOptions)
                .limit(parsedLimit)
                .skip(offset),
            Video.countDocuments(filter)
        ])
        const totalPages = Math.ceil(totalVideos / parsedLimit)

        return res.status(200).json(new ApiResponse(200, { videos: list, totalPages, currentPage: parsedPage }, "video.controllers.js :: Videos fetched successfully"))
    } catch (error) {
        throw new ApiError(500, "video.controllers.js :: Error fetching videos")
    }
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    const videoLocalPath = req.files?.videoFile?.[0].path
    const thumbnailLocalPath = req.files?.thumbnail?.[0].path
    const userId = req.user._id
    if ([title, description, videoLocalPath, thumbnailLocalPath].some(value => !value)) {
        throw new ApiError(400, "video.controllers.js :: All fields are required")
    }
    try {
        const [video, thumbnail] = await Promise.all([
            uploadOnCloudinary(videoLocalPath),
            uploadOnCloudinary(thumbnailLocalPath)
        ])
        const publishedVideo = new Video({
            videoFile: video?.url,
            thumbnail: thumbnail?.url,
            owner: userId,
            title: title,
            description: description,
            duration: video?.duration
        })

        return res.status(200).json(new ApiResponse(200, publishedVideo, "video.controllers.js :: Video published successfully"))
    } catch (error) {
        if (video?.publicId) {
            await deleteFromCloudinary(video.publicId)
        }
        if (thumbnail?.publicId) {
            await deleteFromCloudinary(thumbnail.publicId)
        }
        throw new ApiError(500, "video.controllers.js :: Error publishing video")
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!validateObjectId(videoId, 'Video')) {
        throw new ApiError(401, "video.controllers.js :: Enter the video id to find the video")
    }
    try {
        const video = await Video.findById(videoId)
        if (!video) {
            throw new ApiError(404, "video.controllers.js :: Video not found")
        }

        return res.status(200).json(new ApiResponse(200, video, "video.controllers.js :: Video fetched successfully"))
    } catch (error) {
        throw new ApiError(500, "video.controllers.js :: Error fetching video")
    }
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!validateObjectId(videoId, 'Video')) {
        throw new ApiError(401, "video.controllers.js :: Enter the video id to update the video")
    }
    const { title, description } = req.body
    if (!title || !description) {
        throw new ApiError(404, "video.controllers.js :: All fields are required")
    }
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path
    try {
        const existingVideo = await Video.findById(videoId)
        if (!existingVideo) {
            throw new ApiError(404, "video.controllers.js :: Video not found")
        }

        let videoUpdate = { title, description }
        let newThumbnailUpload
        if (thumbnailLocalPath) {
            newThumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath)
            videoUpdate.thumbnail = newThumbnailUpload?.url
        }
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            videoUpdate,
            { new: true })
        if (!updatedVideo) {
            throw new ApiError(500, "video.controllers.js :: Error updating video")
        }

        if (newThumbnailUpload && existingVideo.thumbnail) {
            await deleteFromCloudinary(existingVideo.thumbnail)
        }

        return res.status(200).json(new ApiResponse(200, video, "video.controllers.js :: Video updated successfully"))
    } catch (error) {
        throw new ApiError(500, "video.controllers.js :: Error updating video")
    }
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id
    if (!validateObjectId(videoId, 'Video')) {
        throw new ApiError(401, "video.controllers.js :: Invalid video id")
    }
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "video.controllers.js :: Video not found")
    }
    checkOwnership(video.owner, userId)
    try {
        await video.deleteOne()
        await deleteFromCloudinary(video.videoFile)
        await deleteFromCloudinary(video.thumbnail)

        return res.status(200).json(new ApiResponse(200, {}, "video.controllers.js :: Video deleted successfully"))
    } catch (error) {
        throw new ApiError(500, "video.controllers.js :: Error deleting video")
    }
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { published } = req.body
    if (published === undefined) {
        throw new ApiError(400, "video.controllers.js :: Published status is required")
    }
    validateObjectId(videoId, 'Video')
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "video.controllers.js :: Video not found")
    }
    video.isPublished = published
    await video.save()

    return res.status(200).json(new ApiResponse(200, video, "video.controllers.js :: Video publish status updated successfully"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
