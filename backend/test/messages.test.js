import supertest from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from 'dotenv';
import app from "../app.js";
import User from "../models/userModel.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, afterEach, beforeEach, test, expect } from "vitest";

dotenv.config({ path: '.env.test' });

const request = supertest.default || supertest;

let mongoServer;
let cookie;
let user1;
let user2;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
});

beforeEach(async () => {
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    user1 = await User.create({
        name: 'Ali',
        username: 'ali_212',
        email: 'ali@email.com',
        password: hashedPass,
    });

    user2 = await User.create({
        name: 'Ahmed',
        username: 'ahmed_111',
        email: 'ahmed@email.com',
        password: hashedPass,
    });

    const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'ali_212', password })
        .set('Accept', 'application/json');
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('_id');
    cookie = res.headers['set-cookie'][0];
    expect(cookie).toBeDefined();
});

afterEach(async () => {
    const collections = Object.keys(mongoose.connection.collections);
    for(const key of collections){
        await mongoose.connection.collections[key].deleteMany({});
    };
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
});

test('POST /api/messages/:id/save should save/create a conversation without sending a message', async () => {
    const res = await request(app)
        .post(`/api/messages/${user2._id}/save`)
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('conversationId');
});

test('GET /api/messages/unseenmessages should return the unSeen messages', async () => {
    const res = await request(app)
        .get('/api/messages/unseenmessages')
        .set('Cookie', cookie);
        
    expect(res.status).toBeOneOf([200, 201]);
});

test("GET /api/messages/conversations should return the user's conversations", async () => {
    const res = await request(app)
        .get('/api/messages/conversations')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
});

test('POST /api/messages/send should send a message', async () => {
    const payload = {
        recipientId: user2._id,
        recipientUserName: user2.username,
        message: 'hello bro',
        video: {
            videoUrl: "",
            publicId: "",
        },
        audio: {
            audioUrl: "",
            publicId: "",
        }
    }

    const res = await request(app)
        .post('/api/messages/send')
        .send(payload)
        .set('Accept', 'application/json')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('sender');
    expect(res.body).toHaveProperty('receiver');
    expect(res.body.sender).toBe(user1._id.toString());
    expect(res.body.receiver).toBe(user2.username);
});

test('GET /api/messages/:otherUserId should return the messages between two user', async () => {
    const payload = {
        recipientId: user2._id,
        recipientUserName: user2.username,
        message: 'hello bro',
        video: {
            videoUrl: "",
            publicId: "",
        },
        audio: {
            audioUrl: "",
            publicId: "",
        }
    }

    const sendMessageRes = await request(app)
        .post('/api/messages/send')
        .send(payload)
        .set('Accept', 'application/json')
        .set('Cookie', cookie);
    
    expect(sendMessageRes.status).toBeOneOf([200, 201]);
    expect(sendMessageRes.body).toHaveProperty('sender');
    expect(sendMessageRes.body).toHaveProperty('receiver');
    expect(sendMessageRes.body.sender).toBe(user1._id.toString());
    expect(sendMessageRes.body.receiver).toBe(user2.username);

    const res = await request(app)
        .get(`/api/messages/${user2._id}?lang=en`)
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body[0]).toHaveProperty('conversationId');
    expect(res.body[0].conversationId).toBe(sendMessageRes.body.conversationId);
});

test('GET /api/messages/:otherUserId should return 404 error because there are no message between users', async () => {
    const res = await request(app)
        .get(`/api/messages/${user2._id}?lang=en`)
        .set('Cookie', cookie);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Conversation not found!');
});