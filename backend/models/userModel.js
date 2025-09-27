import mongoose from "mongoose";

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            minLength: 6,
            required: true,
        },
        profilePic: {
            type: String,
            default: "",
        },
        lang: {
            type: String,
            default: null, 
        }, 
        followers: {
            type: [String],
            default: [],
        },
        following: {
            type: [String],
            default: [],
        },
        bio: {
            type: String,
            default: "",
        },
        isFrozen: {
            type: Boolean,
            default: false
        },
        pushSubscription: {
            endpoint: { type: String },
            keys: {
                auth: { type: String },
                p256dh: { type: String }
            },
        },
    }, 
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;