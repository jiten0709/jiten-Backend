import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyscHandler.js'

const healthcheck = asyncHandler(async (req, res) => {
    try {
        return res.status(200).json(new ApiResponse(200, null, "heathcheck.controller.js :: OK"))
    } catch (error) {
        throw new ApiError(500, `heathcheck.controller.js :: ${error.message}`)
    }
})

export { healthcheck }