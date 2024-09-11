import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { Subscription } from '../models/subscription.model.js'
import { validateObjectId } from '../utils/validateObjectId.js'
import mongoose from 'mongoose'

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const userId = req.user?._id
    if (!validateObjectId(channelId)) {
        throw new ApiError(401, "Insert Channel ID to search for the channel")
    }
    let subscription = await Subscription.findOneAndDelete({
        subscriber: userId,
        channel: channelId
    })
    let isSubscribed
    let newSubscription
    if (subscription) {
        isSubscribed: false
    } else {
        newSubscription = await Subscription.create({
            subscriber: userId,
            channel: channelId
        })
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    isSubscribed,
                    subscription: newSubscription || null
                },
                "subscription.controllers.js :: Subscription status toggled successfully"
            )
        )
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!validateObjectId(channelId)) {
        throw new ApiError(401, "subscription.controllers.js :: Insert channel Id to retrieve the subscribers")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'subscriber',
                foreignField: '_id',
                as: 'subscriber'
            }
        },
        {
            $unwind: '$subscriber'
        },
        {
            $project: {
                _id: 0,
                username: '$subscriber.username'
            }
        }
    ])

    if (subscribers.length === 0) {
        throw new ApiError(404, "subscription.controllers.js :: No subscribers found")
    }
    const response = {
        subscriberCount: subscribers.length,
        subscribers
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                response,
                "subscription.controllers.js :: Subscribers found successfully"
            )
        )
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!validateObjectId(channelId)) {
        throw new ApiError(401, "subscription.controllers.js :: Insert channel Id to retrieve the subscribers")
    }

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'channel',
                foreignField: '_id',
                as: 'subscribedTo'
            }
        },
        {
            $unwind: '$subscribedTo'
        },
        {
            $project: {
                _id: 0,
                username: '$subscribedTo.username'
            }
        }
    ])

    if (channels.length === 0) {
        throw new ApiError(404, "subscription.controllers.js :: No channels found")
    }

    const response = {
        subscribedToCount: channels.length,
        subscribedChannel: channels
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                response,
                "subscription.controllers.js :: Channels found successfully"
            )
        )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}