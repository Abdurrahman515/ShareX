import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import { DateTime } from "luxon";
import mongoose from "mongoose";
import cloudinary from "../config/cloudinary.js";

const createPost = async (req, res) => {
    try {
        const { postedBy, text, img, video } = req.body;
		const lang = req.query.lang || navigator.language.slice(0, 2);

        if (!postedBy || (!text && !video.videoUrl && !img)) {
			return res.status(400).json({ error: lang === 'ar' ? "لا يمكنك إنشاء منشور فارغ!" : "You can't create an empty post!" });
		};

        const user = await User.findById(postedBy);
		if (!user) {
			return res.status(404).json({ error: lang === 'ar' ? "تعذر العثور على المستخدم!" : "User not found" });
		};

		if (user._id.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: lang === 'ar' ? "تعذر التحقق من هوية الناشر!" : "Unauthorized to create post" });
		};

		const maxLength = 500;
		if (text.length > maxLength) {
			return res.status(400).json({ error: lang === 'ar' ? `النص يجب أن يكون أقل من ${maxLength} حرف` : `Text must be less than ${maxLength} characters` });
		};

        const newPost = new Post({ postedBy, text, img, video });
		await newPost.save();

		const postWithUserData = await Post.findById(newPost._id).populate({
			path: 'postedBy',
			select: 'username name profilePic'
		});

		res.status(201).json( postWithUserData );
    } catch (error) {
        res.status(500).json({error: error.message});
        console.log("error in createPost:", error);
    };
};

const repostPost = async (req, res) => {
	try {
		const { pid } = req.params;
		const { text, postedBy } = req.body;

		const lang = req.query.lang || navigator.language.slice(0, 2);

		if (!postedBy || !text) {
			return res.status(400).json({ error: lang === 'ar' ? "الرجاء ملئ حقلا النص والناشر!" : "Postedby and text fields are required" });
		};

		const user = await User.findById(postedBy);
		if (!user) {
			return res.status(404).json({ error: lang === 'ar' ? "لم يتم العثور على المستخدم!" : "User not found" });
		};

		if (user._id.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: lang === 'ar' ? "غير مصرح لنشر منشور!" : "Unauthorized to create post" });
		};

		const maxLength = 500;
		if (text.length > maxLength) {
			return res.status(400).json({ error: lang === 'ar' ? `النص يجب أن يكون أقل من 500 حرف!` : `Text must be less than ${maxLength} characters` });
		};

		const repostedPost = await Post.findById(pid);
		if(!repostedPost){
			return res.status(404).json({ error: lang === 'ar' ? "لا يوجد منشور لإعادة نشره!" : "There are no post to repost!"});
		};

		if(repostedPost.postedBy.toString() === postedBy.toString()){
			return res.status(400).json({ error: lang === 'ar' ? "لا يمكنك إعادة نشر أحد منشوراتك!" :  "You can't repost your post!"});
		};

		const mainPostedUser = await User.findById(repostedPost.postedBy);

		const repostedPostToSave = {
			postId: repostedPost._id,
			isReposted: true,
			text: repostedPost.text,
			img: repostedPost.img,
			video: repostedPost.video,
			postedBy: {
				_id: repostedPost.postedBy,
				username: mainPostedUser.username,
				name: mainPostedUser.name,
				profilePic: mainPostedUser.profilePic
			},
			createdAt: repostedPost.createdAt,
			likes: repostedPost.likes.length,
			replies: repostedPost.replies
		};

		const newPost = new Post({ postedBy, text, repostedPost: repostedPostToSave});
		await newPost.save();

		const postWithUserData = await Post.findById(newPost._id).populate({
			path: 'postedBy',
			select: 'username name profilePic'
		});

		res.status(201).json( postWithUserData );
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in repostPost: ", error);
	};
};

const getPost = async (req, res) => {
    try {
		const lang = req.query.lang || navigator.language.slice(0, 2);

        const post = await Post.findById(req.params.id).populate({
			path: "postedBy",
			select: "username profilePic name isFrozen"
		});

		if (!post) {
			return res.status(404).json({ error: lang === 'ar' ? "تعذر العثور على المنشور!" : "Post not found" });
		};

		res.status(200).json(post);
    } catch (error) {
        res.status(500).json({error: error.message});
        console.log("error in getPost:", error);
    };
};

const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
		const lang = req.query.lang || navigator.language.slice(0, 2);
		if (!post) {
			return res.status(404).json({ error: lang === 'ar' ? "لم يتم العثور على المنشور!" : "Post not found" });
		};

		if (post.postedBy.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: lang === 'ar' ? "غير مصرح لك بحذف منشور!" : "Unauthorized to delete post" });
		};

		if(post.video.publicId) {
			const result = await cloudinary.uploader.destroy(post.video.publicId, { resource_type: 'video' });
	
			if(result.result !== "ok"){
				return res.status(400).json({ error: lang === 'ar' ? "فشل حذف المنشور!" : "Failed to delete post!", result });
			};
		};

        await Post.findByIdAndDelete(req.params.id);

		res.status(200).json({ message: lang === 'ar' ? "تم حذف المنشور بنجاح!" : "Post deleted successfully!" });
    } catch (error) {
        res.status(500).json({error: error.message});
        console.log("error in deletePost:", error);
    };
};

const likeUnlikePost = async (req, res) => {
	try {
		const { id: postId } = req.params;
		const userId = req.user._id;

		const lang = req.query.lang || navigator.language.slice(0, 2);

		const post = await Post.findById(postId);

		if (!post) {
			return res.status(404).json({ error: lang === 'ar' ? "لم يتم العثور على المنشور!" : "Post not found" });
		};

		const userLikedPost = post.likes.includes(userId);

		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			res.status(200).json({ message: lang === 'ar' ? "تم إزالة الإعجاب من المنشور بنجاح!" : "Post unliked successfully" });
		} else {
			// Like post
			post.likes.push(userId);
			await post.save();
			res.status(200).json({ message: lang === 'ar' ? "تم الإعجاب بالمنشور بنجاح!" : "Post liked successfully" });
		};
	} catch (error) {
		res.status(500).json({error: error.message});
        console.log("error in likeUnlikePost:", error);
	};
};

const replyToPost = async (req, res) => {
	try {
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;
		const userProfilePic = req.user.profilePic;
		const username = req.user.username;

		const lang = req.query.lang || navigator.language.slice(0, 2);

		if (!text) {
			return res.status(400).json({ error: lang === 'ar' ? "حقل النص مطلوب!" : "Text field is required" });
		};

		const post = await Post.findById(postId);
		if (!post) {
			return res.status(404).json({ error: lang === 'ar' ? "تعذر العثور على المنشور!" : "Post not found" });
		};

		const reply = { userId, text, userProfilePic, username, createdAt: DateTime.now().toISO() };

		post.replies.push(reply);
		await post.save();

		res.status(200).json( reply );
	} catch (error) {
		res.status(500).json({error: error.message});
        console.log("error in replyToPost:", error);
	};
};

const getFeedPosts = async (req, res) => {
	try {
		const userId = req.user._id;
		const user = await User.findById(userId);

		const lang = req.query.lang || navigator.language.slice(0, 2);

		if (!user) {
			return res.status(404).json({ error: lang === 'ar' ? "تعذر العثور على المستخدم!" : "User not found" });
		};

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 7;
		const skip = ( page - 1 ) * limit;

		const following = user.following.map(id => new mongoose.Types.ObjectId(id));

		const [feedCountAgg] = await Post.aggregate([
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

		const [otherCountAgg] = await Post.aggregate([
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

		const feedPosts = await Post.aggregate([
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
					img: 1,
					likes: 1,
					replies: 1,
					video: 1,
					repostedPost: {
						postId: 1,
						isReposted: 1,
						text: 1,
						img: 1,
						video: 1,
						postedBy: {
							_id: 1,
							username: 1,
							name: 1,
							profilePic: 1,
						},
						createdAt: 1,
						likes: 1,
						replies: 1,
					}
				}
			}
		]);
		
		let posts = [...feedPosts];
		
		if(posts.length < limit) {
			const remaining = limit - posts.length;

			const otherPostsSkip = Math.max(0, skip - (feedCountAgg?.count || 0));

			const OtherPosts = await Post.aggregate([
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
				{ $skip: otherPostsSkip },
				{ $limit: remaining },
				{
					$project: {
						content: 1,
						createdAt: 1,
						postedBy: 1,
						text: 1,
						img: 1,
						likes: 1,
						replies: 1,
						video: 1,
						repostedPost: {
							postId: 1,
							isReposted: 1,
							text: 1,
							img: 1,
							video: 1,
							postedBy: {
								_id: 1,
								username: 1,
								name: 1,
								profilePic: 1,
							},
							createdAt: 1,
							likes: 1,
							replies: 1,
						}
					}
				}
			]);

			posts = [...feedPosts, ...OtherPosts];
		};

		const totalCombinedCount = (feedCountAgg?.count || 0) + (otherCountAgg?.count || 0);
		const hasMore = skip + limit < totalCombinedCount;
		
		res.status(200).json({ posts, hasMore });
	} catch (error) {
		res.status(500).json({error: error.message});
        console.log("error in getFeedPosts:", error);
	};
};

const getUserPosts = async (req, res) => {
	const { username } = req.params;

	try {
		const user = await User.findOne({ username });

		const lang = req.query.lang || navigator.language.slice(0, 2);

		if(!user) return res.status(404).json({error: lang === 'ar' ? "تعذر العثور على المستخدم!" : "User not found!"});

		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 5;
		const skip = ( page - 1 ) * limit;

		const posts = await Post.find({ postedBy: user._id }).populate({
			path: "postedBy",
			select: "username name profilePic"
		}).sort({ createdAt: -1 }).skip(skip).limit(limit);

		const totalPostCount = await Post.countDocuments({ postedBy: user._id });

		const hasMore = skip + limit < totalPostCount;

		res.status(200).json({ posts, hasMore });
	} catch (error) {
		res.status(500).json({error: error.message});
        console.log("error in getUserPosts:", error);
	};
}

export { createPost, getPost, deletePost, likeUnlikePost, replyToPost, getFeedPosts, getUserPosts, repostPost };