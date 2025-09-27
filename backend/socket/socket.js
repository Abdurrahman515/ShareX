import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import Message from '../models/messageModel.js';
import Conversation from '../models/conversationModel.js';

// hash map for keeping the online users in
const userSocketMap = {} //userId: socketId

export const getRecipientSocketId = (recipientId) => {
    return userSocketMap[recipientId];
};


export function initSocketServer(httpServer){
    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"]
        }
    });
    
    io.on('connection', (socket) => {
        console.log('user connected', socket.id);
        const userId = socket.handshake.query.userId; // sent from client (from context folder)
    
        if(userId !== "undefined") userSocketMap[userId] = socket.id;  // the key is userId, and the value is socetId
        io.emit('getOnlineUsers', Object.keys(userSocketMap)); // converting to an array of keys (userId)
    
        socket.on('markMessagesAsSeen', async ({ conversationId, userId }) => {
            try {
                await Message.updateMany({ conversationId: conversationId, seen: false}, {$set: {seen: true}});
                await Conversation.updateOne({ _id: conversationId }, {$set: {"lastMessage.seen": true}});
                io.to(userSocketMap[userId]).emit('messagesSeen', {conversationId});
            } catch (error) {
                console.log(error);
            }
        });
    
        socket.on('userWriting', ({ writingUserId, recipientId }) => {
            io.to(userSocketMap[recipientId]).emit('writing', { writingUserId });
        });
    
        socket.on('userNotWriting', ({ recipientId }) => {
            io.to(userSocketMap[recipientId]).emit('notWriting');
        });
    
        socket.on('userStartedRecording', ({ recordingUserId, recipientId }) => {
            io.to(userSocketMap[recipientId]).emit('userRecording', { recordingUserId });
        });
    
        socket.on('userStoppedRecording', ({ recipientId }) => {
            io.to(userSocketMap[recipientId]).emit('userNotRecording');
        })
    
        socket.on("messageArrived", async ({ senderId, messageId, receiverId, conversationId, message }) => {
            try {
                await Message.updateOne({ _id: messageId, arrived: false }, { $set: { "arrived" : true }});
                await Conversation.updateOne({ _id: conversationId }, { $set: {'lastMessage.arrived': true}});
                io.to(userSocketMap[senderId]).emit("messageSent", { messageId, receiverId, message });
            } catch (error) {
                console.log('Error in messageArrived event: ', error.message || error);
            }
        });
    
        socket.on('disconnect', () => {
            console.log('user disconneted');
            delete userSocketMap[userId];
            io.emit('getOnlineUsers', Object.keys(userSocketMap));
        });
    });

    return io;
};