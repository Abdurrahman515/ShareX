import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import mongoose from "mongoose";
import Post from "../models/postModel.js";
import validator from "validator";

const getUserProfile = async (req, res) => {
	// we will fetch user profile either with username or userId
	// query is username or userId

	const { query } = req.params;

	try {
		let user;
		const lang = req.query.lang || navigator.language.slice(0, 2); // without adding this slice the result will be like: ar-SA

		//query is userId
		if(mongoose.Types.ObjectId.isValid(query)){
			user = await User.findOne({ _id: query }).select("-password").select("-updatedAt");
		} else{
			// query is username
			user = await User.findOne({ username: query }).select("-password").select("-updatedAt");
		};
		
		if(!user) return res.status(404).json({error: lang === 'ar' ? "تعذر العثور على المستخدم!" : "User not found!"});

		user.pushSubscription = null;

		res.status(200).json(user);
	} catch (error) {
		res.status(500).json({error: error.message});   
        console.log("Error in getUserProfile: ", error.message);
	};
};

const getAllUsers = async (req, res) => {
	try {
		const users = await User.find();

		const filteredUsers = users.filter(user => {
			return !user.isFrozen;
		});

		res.status(200).json(filteredUsers);
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log('Error in getAllUsers: ', error);
	};
};

const getSuggestedUsers = async (req, res) => {
	try {
		//exclude the current user and the users that current user allready following from suggested users array
		const userId = req.user._id;

		const usersFollowedByYou = await User.findById(userId).select('following');

		const users = await User.aggregate([ // gives an array of random 10 users
			{
				$match: {
					_id: { $ne: userId }, //$ne: not equal to
					isFrozen: { $ne: true }
				},
			},
			{
				$sample: { size: 10 }
			}
		]);

		const filteredUsers = users.filter(user => !usersFollowedByYou.following.includes(user._id));
		const suggestedUsers = filteredUsers.slice(0,4);

		suggestedUsers.forEach(user => user.password = null);

		res.status(200).json(suggestedUsers);
	} catch (error) {
		res.status(500).json({error: error.message});
		console.log('error in getSuggestedUsers: ' + error.message)
	};
};

const signupUser = async (req, res) => {
    try {
        const { name, email, username, password, lang } = req.body;

		if(!name || !email || !username || !password){
			return res.status(400).json({ error: lang === 'ar' ? "يرجى ملئ جميع الحقول!" : "Please fill in all fields!" });
		};

		if(!validator.isEmail(email)){
			return res.status(400).json({ error: lang === 'ar' ? "يرجى إدخال بريد إلكتروني صالح!" : "Please enter a valid email!" });
		};

		const user = await User.findOne({ $or: [ { email }, { username } ] });

		if (user) {
			return res.status(400).json({ error: lang === 'ar' ? "الحساب موجود بالفعل!" : "User already exists!" });
		};

		if (password.length < 6){
			return res.status(400).json({error: lang === 'ar' ? "يجب أن لا تقل كلمة المرور عن 6 خانات!" : "Password must be 6 characters long at least"});
		};

		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		const newUser = new User({
			name,
			email,
			username,
			password: hashedPassword,
			lang,
		});
		await newUser.save();

		if (newUser) {
            generateTokenAndSetCookie(newUser._id, res);

			res.status(201).json({
				_id: newUser._id,
				name: newUser.name,
				email: newUser.email,
				username: newUser.username,
				bio: newUser.bio,
				profilePic: newUser.profilePic,
				lang: newUser.lang,
			});
		} else {
			res.status(400).json({ error: lang === 'ar' ? "بيانات غير صالحة!" : "Invalid user data" });
		}
    } catch (error) {
        res.status(500).json({error: error.message});   
        console.log("Error in singupUser: ", error.message);
    };
};

const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;
		const user = await User.findOne({ username });
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		const lang = req.query.lang || navigator.language.slice(0, 2);

		if (!user || !isPasswordCorrect) return res.status(400).json({ error: lang === 'ar' ? "اسم المستخدم أو كلمة المرور غير صحيحة!" : "Incorrect username or password!" });

		if(user.isFrozen){
			user.isFrozen = false;
			await user.save();
		};

        generateTokenAndSetCookie(user._id, res);

		res.status(200).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
			bio: user.bio,
			profilePic: user.profilePic,
			lang: user.lang,
		});
    } catch (error) {
        res.status(500).json({error: error.message});   
        console.log("Error in loginUser: ", error.message);
    };
};

const logoutUser = async (req, res) => {
    try {
		const lang = req.query.lang || navigator.language.slice(0, 2);

        res.cookie("jwt", "", { maxAge: 1 });
		res.status(200).json({ message: lang === 'ar' ? "تم تسجيل الخروج بنجاح!" : "User logged out successfully" });
    } catch (error) {
        res.status(500).json({error: error.message});   
        console.log("Error in logoutUser: ", error.message);
    };
};

const followUnFollowUser = async (req, res) => {
	try {
		const { id } = req.params;
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		const lang = req.query.lang || navigator.language.slice(0, 2);

		if (id === req.user._id.toString())
			return res.status(400).json({ error: lang === 'ar' ? "لا يمكنك متابعة/إلغاء متابعة نفسك!" : "You cannot follow/unfollow yourself" });

		if (!userToModify || !currentUser) return res.status(400).json({ error: lang === 'ar' ? "لم يتم العثور على المستخدم!" : "User not found" });

		const isFollowing = currentUser.following.includes(id);

		if (isFollowing) {
			// Unfollow user
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			// حذف الرقم التعريفي الخاص بالمستخدم الحالي من قائمة المتابعين الخاصة بالمستخدم الاخر
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
			// حذف الرقم التعريفي الخاص بالمستخدم الاخر من قائمة المستخدمين الذين يتابعهم المستخدم الحالي
			res.status(200).json({ message: lang === 'ar' ? "تم إلغاء المتابعة بنجاح!" : "User unfollowed successfully!" });
		} else {
			// Follow user
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			//إضافة الرقم التعريفي الخاص بالمستخدم الحالي الى قائمة المتابعين الخاصة بالمستخدم الاخر
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
			// إضافة الرقم التعريفي الخاص بالمستخدم الاخر الى قائمة المستخدمين الذين يتابعهم المستخدم الحالي
			res.status(200).json({ message: lang === 'ar' ? "تمت المتابعة بنجاح!" : "User followed successfully!" });
		};
	} catch (error) {
		res.status(500).json({error: error.message});   
        console.log("Error in followUnFollowUser: ", error.message);
	};
};

const updateUser = async (req, res) => {
	const { name, email, username, password, profilePic, bio, lang } = req.body;
	const userId = req.user._id;

	try {
		let user = await User.findById(userId);
		if (!user) return res.status(400).json({ error: lang === 'ar' ? "لم يتم العثور على المستخدم!" : "User not found" });

		if (req.params.id !== userId.toString())
			return res.status(400).json({ error: lang === 'ar' ? "لا يمكنك تحديث الملف الشخصي الخاص لغيرك!" : "You cannot update other user's profile" });

		if (password) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			user.password = hashedPassword;
		};

		user.name = name || user.name;
		user.email = email || user.email;
		user.username = username || user.username;
		user.profilePic = profilePic || user.profilePic;
		user.bio = bio || user.bio;
		user.lang = lang || user.lang;

		user = await user.save();

		// Find all posts that this user replied and update username and userProfilePic fields
		await Post.updateMany(
			{"replies.userId": userId},
			{
				$set:{
					"replies.$[reply].username": user.username,
					"replies.$[reply].userProfilePic": user.profilePic,
				}
			},
			{arrayFilters:[{"reply.userId": userId}]}
		);

		user.password = null;
		user.pushSubscription = null;

		res.status(200).json({message: lang === 'ar' ? "تم تحديث الملف الشخصي بنجاح!" : "Profile updated successfully!", user});
	} catch (error) {
		res.status(500).json({error: error.message});   
        console.log("Error in updateUser: ", error.message);
	};
};

const freezeAccount = async (req, res) => {
	try {
		const user = await User.findById(req.user._id);
		const lang = req.query.lang || navigator.language.slice(0, 2);

		if(!user) {
			return res.status(404).json({error: lang === 'ar' ? "تعذر العثور على المستخدم!" : "User not found!"});
		};

		user.isFrozen = true;
		await user.save();

		res.status(200).json({ success: true });
	} catch (error) {
		res.status(500).json({error: error.message});   
        console.log("Error in freezeAccount: ", error.message);
	};
};

export {signupUser, loginUser, logoutUser, followUnFollowUser, updateUser, getUserProfile, getSuggestedUsers, freezeAccount, getAllUsers};