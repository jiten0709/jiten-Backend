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
        const publishedVideo = await Video.create({
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
    const { videoId } = req.params;
    const { title, description } = req.body;

    // Check if title and description are provided
    if (!title || !description) {
        throw new ApiError(400, "video.controllers.js :: All fields are required");
    }

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    try {
        // Find the existing video by ID
        const existingVideo = await Video.findById(videoId);
        if (!existingVideo) {
            throw new ApiError(404, "video.controllers.js :: Video not found");
        }

        // Prepare the update object
        let videoUpdate = { title, description };
        let newThumbnailUpload;
        console.log(thumbnailLocalPath)
        // If a new thumbnail is provided, upload it to Cloudinary
        if (thumbnailLocalPath) {
            newThumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);
            console.log("video.controllers.js :: New thumbnail uploaded to Cloudinary");
            videoUpdate.thumbnail = newThumbnailUpload?.url;

            // Delete the old thumbnail from Cloudinary if a new one is uploaded
            if (existingVideo.thumbnail) {
                await deleteFromCloudinary(existingVideo.thumbnail);
                console.log("video.controllers.js :: Old thumbnail deleted from Cloudinary");
            }
        }

        // Update the video in the database
        const updatedVideo = await Video.findByIdAndUpdate(
            videoId,
            videoUpdate,
            { new: true }
        );

        // Check if the video was updated successfully
        if (!updatedVideo) {
            throw new ApiError(500, "video.controllers.js :: Error updating video data");
        }

        // Return the updated video in the response
        return res.status(200).json(new ApiResponse(200, updatedVideo, "video.controllers.js :: Video updated successfully"));
    } catch (error) {
        // Log the error and return a 500 response
        console.error("video.controllers.js :: Error updating video:", error);
        throw new ApiError(500, "video.controllers.js :: Error updating video");
    }
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "video.controllers.js :: Video not found")
    }
    checkOwnership(video.owner, userId)
    try {
        await deleteFromCloudinary(video.videoFile)
        await deleteFromCloudinary(video.thumbnail)
        await video.deleteOne()

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
