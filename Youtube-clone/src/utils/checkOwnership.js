import { ApiError } from "./ApiError.js";

export const checkOwnership = (ownerId, userId, resource = 'resource') => {
    if (ownerId.toString() !== userId.toString()) {
        throw new ApiError(403, `You are not the owner of this ${resource}`);
    }
}