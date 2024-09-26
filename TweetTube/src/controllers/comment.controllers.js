import { asyncHandler } from '../utils/asyncHandler.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { validateObjectId } from '../utils/validateObjectId.js'
import { Comment } from '../models/comment.models.js'

const getVideoComments = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        let { page = 1, limit = 10 } = req.query
        page, limit = parseInt(page, 10), parseInt(limit, 10)
        validateObjectId(videoId, 'Video')
        const offset = page * limit - limit
        const comments = await Comment.find({ video: videoId }).limit(limit).skip(offset)
        const totalComments = await Comment.countDocuments({ video: videoId })
        const totalPages = Math.ceil(totalComments / limit)

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { comments, totalComments, totalPages, currentPage: page },
                    "comment.controllers.js :: Comments fetched successfully"
                )
            )
    } catch (error) {
        throw new ApiError(500, `comment.controllers.js :: getVideoComments ${error.message}`)
    }
})

const addComment = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.params
        const { content } = req.body
        if (!content) {
            throw new ApiError(400, "content is required")
        }
        validateObjectId(videoId, "Video")
        const comment = await Comment.create({
            content: content,
            video: videoId,
            owner: req.user._id
        })

        return res
            .status(200)
            .json(
                new ApiResponse(200, comment, "comment.controllers.js :: Comment added successfully")
            )
    } catch (error) {
        throw new ApiError(500, `comment.controllers.js :: addComment :: ${error.message}`)
    }
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { userId } = req.user._id
    const { content } = req.body
    validateObjectId(commentId, 'Comment')
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "comment.controllers.js :: Comment not found")
    }
    if (comment.owner?.toString() !== userId?.toString()) {
        throw new ApiError(403, "comment.controllers.js :: You are not authorized to update this comment")
    }
    comment.content = content
    await comment.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, comment, "comment.controllers.js :: Comment updated successfully")
        )
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { userId } = req.user._id
    validateObjectId(commentId, 'Comment')
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "comment.controllers.js :: Comment not found")
    }
    if (comment.owner?.toString() !== userId?.toString()) {
        throw new ApiError(403, "comment.controllers.js :: You are not authorized to delete this comment")
    }
    await Comment.deleteOne({ _id: commentId })

    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, "comment.controllers.js :: Comment deleted successfully")
        )
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}