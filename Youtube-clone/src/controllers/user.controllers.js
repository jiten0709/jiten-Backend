import { asyncHandler } from "../utils/asyscHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

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

    if (!(username || email)) {
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

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}