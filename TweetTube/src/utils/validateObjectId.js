import mongoose from "mongoose";
import { ApiError } from './ApiError.js'

export const validateObjectId = (id, type) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, `utils/validateObjectId.js :: Invalid ${type} ID`);
    }
}