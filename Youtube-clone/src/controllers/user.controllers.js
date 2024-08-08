import { asyncHandler } from "../utils/asyscHandler.js";
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
        throw new ApiError(400, 'Please fill in all fields')
    }

    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (userExists) {
        throw new ApiError(409, 'User already exists')
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, 'Avatar is required')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, 'Error uploading avatar')
    }

    const user = await User.create({
        fullName,
        email,
        password,
        username: username.tolowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if (!createdUser) {
        throw new ApiError(500, 'Error creating user')
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, 'User created successfully')
    )
})

export { registerUser }