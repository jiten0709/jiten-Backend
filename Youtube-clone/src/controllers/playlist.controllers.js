import { asyncHandler } from '../utils/asyscHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
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

})

const getPlaylistById = asyncHandler(async (req, res) => { })

const addVideoToPlaylist = asyncHandler(async (req, res) => { })

const removeVideoFromPlaylist = asyncHandler(async (req, res) => { })

const deletePlaylist = asyncHandler(async (req, res) => { })

const updatePlaylist = asyncHandler(async (req, res) => { })

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}