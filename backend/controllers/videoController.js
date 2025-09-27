import Video from '../models/videoModel.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';
import { DateTime } from "luxon";
import cloudinary from '../config/cloudinary.js';

const getSignature = async (req, res) => {
    try {
        const userId = req.user._id;
        const { type } = req.params;
        const user = await User.findById(userId);

        const lang = req.query.lang || navigator.language.slice(0, 2);

        if (!user) {
            return res.status(401).json({ error: lang === 'ar' ? "تعذر التحقق من هوية المستخدم!" : "Unauthorized!" });
        };

        const timestamp = Math.round(new Date().getTime() / 1000);

        const folderName = type === "video" ? "user_videos" : "user_voices";

        const paramsToSign = {
            timestamp: timestamp,
            folder: folderName, // a folder inside cloudinary
        };

        const signature = cloudinary.utils.api_sign_request(paramsToSign,  process.env.API_SECRET);

        res.status(200).json({
            timestamp: timestamp,
            signature: signature,
            cloudName: process.env.CLOUD_NAME,
            apiKey: process.env.API_KEY,
        });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error!" });
        console.log("Error in getSignature Controller: ", error);
    }
};

const saveVideo = async (req, res) => { // actually should be CreateReel
    try {
        const { text, video, publicId } = req.body;
        const userId = req.user._id;
        const lang = req.query.lang || navigator.language.slice(0, 2);
        const user = await User.findById(userId);

        if(!user) {
            return res.status(401).json({ error: lang === 'ar' ? "فشل التحقق من هوية المستخدم!" : "Unauthorized!" });
        };

        if(!video || !publicId) {
            return res.status(400).json({ error: lang === 'ar' ? "رابط الفيديو مطلوب للمتابعة!" : "Video and publicId are required!" });
        };

        const newVideo = await Video.create({
            text: text || "",
            video: video,
            publicId: publicId,
            postedBy: user._id,
        });

        const videoWithUserData = await Video.findOne({ publicId: newVideo.publicId }).populate({
            path: 'postedBy',
            select: 'username name profilePic',
        });

        res.status(201).json({
            message: lang === 'ar' ? "تم إنشاء المقطع بنجاح!" : "Reel created successfully!",
            video: videoWithUserData,
        });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error!" });
        console.log("Error in SaveVideo Controller: ", error);
    }
};

const getReelVideo = async (req, res) => {
    try {
        const { id } = req.params;

        const lang = req.query.lang || navigator.language.slice(0, 2);

        if(!id) {
            return res.status(400).json({ error: lang === 'ar' ? 'الرقم التعريفي للفيديو مطلوب للمتابعة!' : "Video ID is required!" });
        };

        const video = await Video.findById(id).populate({
            path: 'postedBy',
            select: 'username name profilePic',
        });

        if(!video) {
            return res.status(404).json({ error: lang === 'ar' ? 'تعذر العثور على الفيديو!' : "Video not found!" });
        };

        res.status(200).json(video);
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error!" });
        console.log("Error in getReelVideo Controller: ", error);
    }
};

const getFeedVideos = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        const lang = req.query.lang || navigator.language.slice(0, 2);

        if (!user) {
            return res.status(401).json({ error: lang === 'ar' ? "تعذر التحقق من هوية المستخدم!" : "Unauthorized!" });
        };

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = ( page - 1 ) * limit;

        const following = user.following.map(id => new mongoose.Types.ObjectId(id));

        const [feedCountAgg] = await Video.aggregate([
            {
                $match: {
                    postedBy: { $in: following }
                }
            },
            {
                $lookup: {
                    from: "users",
                    let: { postedById: "$postedBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$postedById"] },
                                        { $eq: ["$isFrozen", false] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "postedBy"
                }
            },
            { $unwind: "$postedBy" },
            { $count: "count" }
        ]);

        const [otherCountAgg] = await Video.aggregate([
            {
                $match: { postedBy: { $nin: following } }
            },
            {
                $lookup: {
                    from: "users",
                    let: { postedById: "$postedBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$postedById"] },
                                        { $eq: ["$isFrozen", false] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "postedBy"
                }
            },
            { $unwind: "$postedBy" },
            { $count: "count" }
        ]);

        const feedVideos = await Video.aggregate([
            {
                $match: {
                    postedBy: { $in: following }
                },
            },
            {
                $lookup: {
                    from: "users",
                    let: { postedById: "$postedBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$postedById"] },
                                        { $eq: ["$isFrozen", false] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                name: 1,
                                profilePic: 1,
                                isFrozen: 1
                            }
                        }
                    ],
                    as: "postedBy"
                }
            },
            { $unwind: "$postedBy" },
            { $sort: { createdAt: -1 }},
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    postedBy: 1,
                    text: 1,
                    video: 1,
                    publicId: 1,
                    likes: 1,
                    replies: 1,
                }
            }
        ]);
        
        let videos = [...feedVideos];
        
        if(videos.length < limit) {
            const remaining = limit - videos.length;

            const otherVideosSkip = Math.max(0, skip - (feedCountAgg?.count || 0));

            const OtherVideos = await Video.aggregate([
                {
                    $match: {
                        postedBy: { $nin: following }
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        let: { postedById: "$postedBy" },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$_id", "$$postedById"] },
                                            { $eq: ["$isFrozen", false] }
                                        ]
                                    }
                                }
                            },
                            {
                                $project: {
                                    _id: 1,
                                    username: 1,
                                    name: 1,
                                    profilePic: 1,
                                    isFrozen: 1
                                }
                            }
                        ],
                        as: "postedBy"
                    }
                },
                { $unwind: "$postedBy" },
                { $sort: { createdAt: -1 }},
                { $skip: otherVideosSkip },
                { $limit: remaining },
                {
                    $project: {
                        content: 1,
                        createdAt: 1,
                        postedBy: 1,
                        text: 1,
                        video: 1,
                        publicId: 1,
                        likes: 1,
                        replies: 1,
                    }
                }
            ]);

            videos = [...feedVideos, ...OtherVideos];
        };

        const totalCombinedCount = (feedCountAgg?.count || 0) + (otherCountAgg?.count || 0);
        const hasMore = skip + limit < totalCombinedCount;
        
        res.status(200).json({ videos, hasMore });        
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error!" });
        console.log("Error in getVideos Controller: ", error);
    }
};

const getUserVideos = async (req, res) => {
    try {
        const { username } = req.params;
        const lang = req.query.lang || navigator.language.slice(0, 2);
        
        const user = await User.findOne({ username });
        if(!user){
            return res.status(404).json({ error: lang === 'ar' ? "لم يتم العثور على المستخدم!" : "User not found!" });
        };

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 4;
        const skip = ( page - 1 ) * limit;

        const videos = await Video.find({ postedBy: user._id }).populate({
            path: 'postedBy',
            select: 'username name profilePic',
        }).sort({ createdAt: -1 }).skip(skip).limit(limit);

        const totalVideos = await Video.countDocuments({ postedBy: user._id });

        const hasMore = skip + limit < totalVideos;

        res.status(200).json({ videos, hasMore });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error!" });
        console.log("Error in getUserVideos Controller: ", error);
    }
};

const likeOrUnlikeVideo = async (req, res) => {
    try {
        const { id: videoId } = req.params;
        const userId = req.user._id;
        const lang = req.query.lang || navigator.language.slice(0, 2);

        const video = await Video.findById(videoId);

        if(!video) return res.status(404).json({ error: lang === 'ar' ? "تعذر العثور على الفيديو!" : "Video not found!" });

        const userLikedVideo = video.likes.includes(userId);

        if(userLikedVideo){
            // unlike video
            await Video.updateOne({ _id: videoId }, { $pull: { likes: userId }});
            res.status(200).json({ message: lang === 'ar' ? "تم إلغاء الإعجاب بنجاح!" : "Video unliked successfully!" });
        }else {
            // like video
            video.likes.push(userId);
            await video.save();
            res.status(200).json({ message: lang === 'ar' ? "تم الإعجاب بالفيديو بنجاح!" : "Video liked successfully!" });
        };
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error"});
        console.log("Error in likeOrUnlikeVideo controller: ", error);
    };
};

const replyToVideo = async (req, res) => {
    try {
        const { id: videoId } = req.params;
        const { text } = req.body;
        const { _id: userId, profilePic: userProfilePic, username } = req.user;
        const lang = req.query.lang || navigator.language.slice(0, 2);

        const video = await Video.findById(videoId);
        if(!video){
            return res.status(404).json({ error: lang === 'ar' ? "تعذر العثور على الفيديو!" : "Video not found!" });
        };

        const reply = { userId, text, userProfilePic, username, createdAt: DateTime.now().toISO()};

        video.replies.push(reply);
        await video.save();

        res.status(201).json( reply );
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error"});
        console.log("Error in replyToVideo controller: ", error);
    }
};

const deleteReel = async (req, res) => {
    try {
        const { id: videoId } = req.params;
        const userId = req.user._id;
        const lang = req.query.lang || navigator.language.slice(0, 2);

        const video = await Video.findById(videoId);
        if(!video){
            return res.status(404).json({ error: lang === 'ar' ? "لم يتم العثور على الفيديو!" : "Video not found!" });
        };

        if(video.postedBy.toString() !== userId.toString()){
            return res.status(401).json({ error: lang === 'ar' ? "لست مُخول لحذف الفيديو!" : "Unauthorized to delete post" });
        };
        
        const result = await cloudinary.uploader.destroy(video.publicId, { resource_type: "video" });

        if(result.result !== "ok"){
            return res.status(400).json({ error: lang === 'ar' ? "فشل حذف الفيديو!" : "Failed to delete video!", result });
        };

        await Video.findByIdAndDelete(videoId);

        res.status(200).json({ message: lang === 'ar' ? "تم حذف الفيديو بنجاح!" : "Video deleted successfully!", result, videoId });
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error" });
        console.log("Error in deleteReel controller: ", error);
    }
};

const getSuggestedReels = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const videos = await Video.aggregate([
            {
                $match: {
                    postedBy: { $ne: userId },
                },
            },
            {
                $lookup: {
                    from: "users",
                    let: { postedById: "$postedBy" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$_id", "$$postedById"] },
                                        { $eq: ["$isFrozen", false] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: {
                                _id: 1,
                                username: 1,
                                name: 1,
                                profilePic: 1,
                            }
                        }
                    ],
                    as: "postedBy"
                }
            },
            { $unwind: "$postedBy" },
            { $sort: { createdAt: -1 }},
            {
                $sample: {
                    size: 3
                }
            },
        ]);

        res.status(200).json( videos );
    } catch (error) {
        res.status(500).json({ error: error.message || "Internal Server Error" });
        console.log("Error in getSuggestedReels: ", error);
    }
};

export { saveVideo, getSignature, getFeedVideos, getUserVideos, getReelVideo, likeOrUnlikeVideo, replyToVideo, deleteReel, getSuggestedReels };