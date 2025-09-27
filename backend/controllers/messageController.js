import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import { getRecipientSocketId } from "../socket/socket.js";

const saveConversation = async (req, res) => {
    try {
        const userId = req.user._id;
        const { otherUserId } = req.params;
        const lang = req.query.lang || navigator.language.slice(0, 2);

        const isConversationExist = await Conversation.findOne({ participants: { $all: [ userId, otherUserId ]}});

        const otherUser = await User.findById(otherUserId);
        if(otherUser.isFrozen){
            return res.status(400).json({ error: lang === 'ar' ? "قام المستخدم بتجميد حسابه!" : "The user has frozen their account!"});
        };

        if(isConversationExist){
            return res.status(400).json({ error: lang === 'ar' ? "المحادثة محفوظة بالفعل!" : "Conversation allready exist!"});
        };

        const newConversation = new Conversation({
            participants: [ userId, otherUserId ],
            lastMessage: {
                text: "",
            }
        });

        await newConversation.save();

        const conversation = await Conversation.findOne({ participants: { $all: [ userId, otherUserId ]}});

        res.status(200).json({ conversationId: conversation._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log('Error in saveConversation: ', error);
    };
};

const sendMessage = async (req, res) => {
    try {
        const { recipientId, message, img, recipientUserName, video, audio } = req.body;
        const senderId = req.user._id;
        const lang = req.query.lang || navigator.language.slice(0, 2);

        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, recipientId]}
        });

        const recipientUser = await User.findById(recipientId);
        if(recipientUser.isFrozen){
            return res.status(400).json({ error: lang === 'ar' ? "المستخدم قام بتجميد حسابه!" : "The user has frozen their account!"});
        };

        const isVideo = video.videoUrl ? true : false;
        const isAudio = audio.url ? true : false;

        // if this is the first message between those users
        if(!conversation){
            conversation = new Conversation({
                participants: [senderId, recipientId],
                lastMessage: {
                    text: message,
                    sender: senderId,
                    isVideo,
                    isAudio,
                }
            });

            await conversation.save();
        };

        //if those users has been allready sent a message to each other before
        const newMessage = new Message({
            conversationId: conversation._id,
            sender: senderId,
            receiver: recipientUserName,
            text: message,
            img,
            audio,
            video
        });
        
        await Promise.all([
            newMessage.save(),
            conversation.updateOne({
                lastMessage: {
                    text: message,
                    sender: senderId,
                    isVideo,
                    isAudio,
                }
            })
        ]);
        
        const messageWithUserData = await Message.findOne({ _id: newMessage._id }).populate({
            path: 'sender',
            select: 'username profilePic'
        });

        const recipientSocketId = getRecipientSocketId(recipientId);
        if (recipientSocketId) {
            const io = req?.app?.locals?.io;
            if(io){
                io.to(recipientSocketId).emit("newMessage", messageWithUserData);
            };
        };

        res.status(201).json(newMessage);

    } catch (error) {
        res.status(500).json({ error: error.message });
    };
};

const getUnSeenMessages = async (req, res) => {
    try {
        const username = req.user.username;
        
        const unSeenMessages = await Message.find({ seen: false, receiver: username }).populate({
            path: 'sender',
            select: 'username profilePic'
        });

        res.status(200).json(unSeenMessages);
    } catch (error) {
        res.status(500).json({error: error.message});
        console.log(error)
    };
};

const getMessages = async (req, res) => {
    const { otherUserId } = req.params;
    const userId = req.user._id;
    try {
        const lang = req.query.lang || navigator.language.slice(0, 2);

        const conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId]}
        });

        if(!conversation){
            return res.status(404).json({ error: lang === 'ar' ? "تعذر العثور على المحادثة!" : 'Conversation not found!'});
        };

        const messages = await Message.find({
            conversationId: conversation._id
        });

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log('error in getMessages: ',error );
    };
};

const getConversations = async (req, res) => {
    try {
        const userId = req.user._id;

        const conversations = await Conversation.find({
            participants: userId
        }).populate({
            path: "participants",
            select: "username profilePic isFrozen",
        });

        // remove the current user from participants array
        conversations.forEach(conversation => {
            conversation.participants = conversation.participants.filter(
                participant => participant._id.toString() !== userId.toString()
            );
        });

        res.status(200).json(conversations);

    } catch (error) {
        res.status(500).json({ error: error.message });
        console.log(error);
    };
};



export { sendMessage, getMessages, getConversations, getUnSeenMessages, saveConversation };