import { asyncHandler } from '../utils/asyscHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { checkOwnership } from '../utils/checkOwnership.js'
import { validateObjectId } from '../utils/validateObjectId.js'
import { Tweet } from '../models/tweet.models.js'

const createTweet = asyncHandler(async (req, res) => {
    const { owner } = req.user._id
    const { content } = req.body
    if (!content) {
        throw new ApiError(400, "tweet.controllers.js :: content is required")
    }
    const result = await Tweet.create({ owner: owner, content: content })
    if (!result) {
        throw new ApiError(500, "tweet.controllers.js :: Something went wrong")
    }
    return res.status(200).json(new ApiResponse(200, result, "tweet.controllers.js :: Successfully created tweet"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params
    validateObjectId(userId, 'User')
    const result = await Tweet.find({ owner: userId })
    return res.status(200).json(new ApiResponse(200, result, "tweet.controllers.js :: Successfully fetched user tweets"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { tweetId } = req.params
    const { content } = req.body
    validateObjectId(tweetId)
    if (!content.trim()) {
        throw new ApiError(400, "tweet.controllers.js :: content is required")
    }
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "tweet.controllers.js :: Tweet not found")
    }
    checkOwnership(tweet.owner, userId)
    tweet.content = content
    tweet.save()
    if (!tweet) {
        throw new ApiError(500, "tweet.controllers.js :: Something went wrong")
    }
    return res.status(200).json(new ApiResponse(200, tweet, "tweet.controllers.js :: Successfully updated tweet"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const { tweetId } = req.params
    validateObjectId(tweetId)
    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "tweet.controllers.js :: Tweet not found")
    }
    checkOwnership(tweet.owner, userId)
    await tweet.deleteOne({ _id: tweetId })
    return res.status(200).json(new ApiResponse(200, null, "tweet.controllers.js :: Successfully deleted tweet"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}