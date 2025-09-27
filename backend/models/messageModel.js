import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    receiver: {
        type: String,
        ref: 'User'
    },
    text: String,
    seen: {
        type: Boolean,
        default: false
    },
    img: String,
    video: {
        videoUrl: String,
        publicId: String,
    },
    audio: {
        url: String,
        publicId: String,
        duration: String,
    },
    arrived: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

export default Message;