import { asyncHandler } from "../utils/asyscHandler.js";

const registerUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "User registered successfully"
    })
})

export { registerUser }