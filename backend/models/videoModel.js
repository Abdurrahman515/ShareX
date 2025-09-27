import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String, 
    },
    video: {
        type: String, 
        required: true
    },
    publicId: {
        type: String, 
        required: true
    },
    likes: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'User',
        default: []
    },
    replies: [
        {
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            text: {
                type: String,
                required: true,
            },
            userProfilePic: {
                type: String,
            },
            username: {
                type: String,
            },
            createdAt: {
                type: mongoose.Schema.Types.Date,
                default: Date.now,
            }
        }
    ]
}, {
    timestamps: true
});

const Video = mongoose.model('Video', videoSchema);

export default Video;