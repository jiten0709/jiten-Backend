import { asyncHandler } from "../utils/asyscHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { User } from '../models/user.models.js'
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, 'user.controllers :: Error generating tokens')
    }
}

const registerUser = asyncHandler(async (req, res) => {
    /*
    1. get user details from frontend
    2. validate - non empty
    3. check if user already exists
    4. check for avatar and images
    5. upload images to cloudinary
    6. create entry in database
    7. remove password from refreshToken from response
    8. check for user creation
    9. return response
    */

    const { fullName, email, username, password } = req.body
    if ([fullName, email, username, password].some((field) => field?.trim() === '')) {
        throw new ApiError(400, 'user.controllers :: Please fill in all fields')
    }

    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (userExists) {
        throw new ApiError(409, 'user.controllers :: User already exists')
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, 'user.controllers :: Avatar is required')
    }

    if (!coverImageLocalPath) {
        throw new ApiError(400, 'user.controllers :: Cover image is required')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, 'user.controllers :: Error uploading avatar')
    }

    if (!coverImage) {
        throw new ApiError(400, 'user.controllers :: Error uploading cover image')
    }

    const user = await User.create({
        fullName,
        email,
        password,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage.url
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500, 'user.controllers :: Error creating user')
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, 'user.controllers :: User created successfully')
    )
})

const loginUser = asyncHandler(async (req, res) => {
    /*
    1. req.body => data from frontend
    2. username or email for login
    3. finf user in database
    4. password check
    5. generate access and refresh tokens
    6. send cookies
    */

    const { username, email, formPassword } = req.body

    if (!username || !email) {
        throw new ApiError(400, 'user.controllers :: Please provide username or email')
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new ApiError(404, 'user.controllers :: User does not exist')
    }

    const isPasswordValid = await user.isPasswordCorrect(formPassword)
    if (!isPasswordValid) {
        throw new ApiError(400, 'user.controllers :: Invalid user credentials')
    }

    const { newAccessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)
    const { password, refreshToken, ...loggedInUser } = user.toObject()
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie('accessToken', newAccessToken, options)
        .cookie('refreshToken', newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser, newAccessToken, newRefreshToken
                },
                'user.controllers :: User logged in successfully'
            )
        )
})

const logoutUser = asyncHandler(async (req, res) => {
    /*
    1. set refreshToken to null
    2. save user
    3. clear cookies
    4. return response
    */
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }
        },
        { new: true }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }
    return res
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'user.controllers :: User logged out successfully'))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401, 'user.controllers :: Unauthorized request')
    }
    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)
        if (!user) {
            throw new ApiError(401, 'user.controllers :: Invalid refresh token')
        }
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, 'user.controllers :: Refresh token is expired or used')
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    'user.controllers :: Access token refreshed'
                )
            )
    } catch (error) {
        throw new ApiError(401, `user.controllers :: ${error?.message}` || 'user.controllers :: Invalid refresh token')
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordValid = await User.isPasswordCorrect(currentPassword)

    if (!isPasswordValid) {
        throw new ApiError(400, 'user.controllers :: Invalid current password')
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'user.controllers :: Password changed successfully'))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, 'user.controllers :: User details'))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body
    if (!fullName || !email) {
        throw new ApiError(400, 'user.controllers :: Please provide fullName or email')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, 'user.controllers :: Account details updated'))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, 'user.controllers :: Avatar is required')
    }

    // TODO: delete old avatar from cloudinary

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(400, 'user.controllers :: Error uploading avatar')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image updated successfully")
        )
})

const updateUserAvatarWithTodo = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, 'user.controllers :: Avatar is required')
    }

    const user = await User.findById(req.user?._id)
    const oldAvatarUrl = user?.avatar.split('/').pop().split('.')[0]
    if (oldAvatarUrl) {
        await deleteFromCloudinary(oldAvatarUrl)
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar) {
        throw new ApiError(400, 'user.controllers :: Error uploading avatar')
    }
    user.avatar = avatar.url
    await user.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'user.controllers :: Avatar image updated successfully')
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )
})

const updateUserCoverImageWithTodo = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path
    if (!coverImageLocalPath) {
        throw new ApiError(400, 'user.controllers :: Cover image is required')
    }

    const user = await User.findById(req.user?._id)
    const oldCoverImageUrl = user?.coverImage.split('/').pop().split('.')[0]
    if (oldCoverImageUrl) {
        await deleteFromCloudinary(oldCoverImageUrl)
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage) {
        throw new ApiError(400, 'user.controllers :: Error uploading cover image')
    }
    user.coverImage = coverImage.url
    await user.save()

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, 'user.controllers :: Cover image updated successfully')
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username) {
        throw new ApiError(400, 'user.controllers :: Please provide username')
    }

    const channel = await User.aggregate([
        {
            $match: { username: username?.toLowerCase() }
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers'
            }
        },
        {
            $lookup: {
                from: 'subscroptions',
                localField: '_id',
                foreignField: 'subscriber',
                as: 'subscribedTo'
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: '$subscribers'
                },
                channelsSubscribedToCount: {
                    $size: '$subscribedTo'
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, '$subscribers.subscriber'] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(404, 'user.controllers :: Channel not found')
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channel[0], 'user.controllers :: Channel details'))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: { _id: new mongoose.Types.ObjectId(req.user?._id) }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'watchHistory',
                foreignField: '_id',
                as: 'watchHistory',
                pipeline: [
                    {
                        $loookup: {
                            from: 'users',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'owner',
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: '$owner' }
                        }
                    }
                ]
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, user[0]?.watchHistory, 'user.controllers :: Watch history fetched'))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserAvatarWithTodo,
    updateUserCoverImage,
    updateUserCoverImageWithTodo,
    getUserChannelProfile,
    getWatchHistory
}