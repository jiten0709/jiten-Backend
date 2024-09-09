import { asyncHandler } from '../utils/asyscHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { validateObjectId } from '../utils/validateObjectId.js'
import { checkOwnership } from '../utils/checkOwnership.js'
import mongoose from 'mongoose'
import { Playlist } from '../models/playlist.models.js'

const createPlaylist = asyncHandler(async (req, res) => {
    const owner = req.user._id
    const { name, description, videos } = req.body
    if ([name, description, videos].some((item) => !item)) {
        throw new ApiError(400, "playlist.controllers.js :: All fields are required")
    }
    if (videos?.length() === 0) {
        throw new ApiError(400, "playlist.controllers.js :: Atleast one video is required")
    }
    if (videos?.length() > 0) {
        videos.map((item) => {
            if (!mongoose.Types.ObjectId.isValid(item)) {
                throw new ApiError(400, "playlist.controllers.js :: Invalid video id in the videos array")
            }
        })
    }
    const result = await Playlist.create({
        name: name,
        description: description,
        videos: videos,
        owner: owner
    })
    if (!result) {
        throw new ApiError(500, "playlist.controllers.js :: Something went wrong")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "playlist.controllers.js :: Playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params
    validateObjectId(userId, 'User')
    const result = await Playlist.find({
        owner: userId
    })
    if (!result) {
        throw new ApiError(404, "playlist.controllers.js :: Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "playlist.controllers.js :: User playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    validateObjectId(playlistId, 'Playlist')
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "playlist.controllers.js :: Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist.controllers.js :: Playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    validateObjectId(playlistId, 'Playlist')
    validateObjectId(videoId, 'Video')
    const result = await Playlist.findByIdAndUpdate(playlistId,
        { $addToSet: { videos: videoId } },
        { new: true })
    if (!result) {
        throw new ApiError(404, "playlist.controllers.js :: Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "playlist.controllers.js :: Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    validateObjectId(playlistId, 'Playlist')
    validateObjectId(videoId, 'Video')
    const result = await Playlist.findByIdAndUpdate(playlistId,
        { $pull: { videos: videoId } },
        { new: true })
    if (!result) {
        throw new ApiError(404, "playlist.controllers.js :: Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "playlist.controllers.js :: Video removed from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { playlistId } = req.params
    validateObjectId(playlistId, 'Playlist')
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "playlist.controllers.js :: Playlist not found")
    }
    checkOwnership(playlist.owner, userId)
    await Playlist.findByIdAndDelete({ _id: playlistId })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "playlist.controllers.js :: Playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description } = req.body
    if ([name, description].some((item) => !item)) {
        throw new ApiError(400, "playlist.controllers.js :: All fields are required")
    }
    validateObjectId(playlistId, 'Playlist')
    const result = await Playlist.findByIdAndUpdate(
        playlistId,
        { name: name, description: description },
        { new: true }
    )
    if (!result) {
        throw new ApiError(404, "playlist.controllers.js :: Playlist not found")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, "playlist.controllers.js :: Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}