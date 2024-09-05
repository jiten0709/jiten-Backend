import mongoose from "mongoose";
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        require: true
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

commentSchema.plugin()
export default Comment = mongoose.model('Comment', commentSchema)