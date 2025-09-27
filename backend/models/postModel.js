import mongoose from "mongoose";
import { DateTime } from 'luxon';

const postSchema = mongoose.Schema(
    {
        postedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		text: {
			type: String,
			maxLength: 500,
		},
		img: {
			type: String,
		},
		video: {
			videoUrl: String,
			publicId: String
		},
		likes: {
			// array of user ids
			type: [mongoose.Schema.Types.ObjectId],
			ref: "User",
			default: [],
			// the liks count will be the length of this array
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
					default: DateTime.now().toISO(),
				}
			},
		],
		repostedPost: {
			postId: {
				type: mongoose.Schema.Types.ObjectId, 
			},
			isReposted: {
				type: Boolean,
				default: false
			},
			text: {
				type: String,
			},
			img: {
				type: String,
			},
			video: {
				videoUrl: String,
				publicId: String
			},
			postedBy: {
				_id: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User'
				},
				username: {
					type: String,
				},
				name: {
					type: String,
				},
				profilePic: {
					type: String
				}
			},
			createdAt: {
				type: mongoose.Schema.Types.Date,
			},
			likes: {
				type: Number,
				default: 0,
			},
			replies: [
				{
					userId: {
						type: mongoose.Schema.Types.ObjectId,
						ref: 'User',
					},
					userProfilePic: {
						type: String
					}
				}
			]
		}
    },
    {
		timestamps: true,
	}
);

const Post = mongoose.model("Post", postSchema);

export default Post;