import supertest from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from 'dotenv';
import app from "../app.js";
import User from "../models/userModel.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { beforeAll, afterAll, beforeEach, afterEach, test, expect } from "vitest";
import Video from "../models/videoModel.js";

dotenv.config({ path: '.env.test' });

const request = supertest.default || supertest;

let mongoServer;
let user;
let cookie;
let video;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
});

beforeEach(async () => {
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    user = await User.create({
        name: 'Ali',
        username: 'ali_212',
        email: 'ali@email.com',
        password: hashedPass,
    });

    const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'ali_212', password })
        .set("Accept", 'application/json');

    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('_id');
    cookie = res.headers['set-cookie'][0];
    expect(cookie).toBeDefined();

    video = await Video.create({
        postedBy: user._id,
        video: 'testurl',
        publicId: 'testpublic'
    });
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

test('GET /api/videos/get-signature/:type should return a signature to be abble to upload a video to cloudinary from client', async () => {
    const res = await request(app)
        .get('/api/videos/get-signature/video')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('signature');
    expect(res.body).toHaveProperty('cloudName');
    expect(res.body).toHaveProperty('apiKey');
});

test('GET /api/videos shoud return the feed of videos', async () => {
    const res = await request(app)
        .get('/api/videos')
        .set('Cookie', cookie);
    
    console.log(res.body);

    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('hasMore');
    expect(res.body).toHaveProperty('videos');
});

test('GET /api/videos/suggested should return a sample of reels/videos', async () => {
    const res = await request(app)
        .get('/api/videos/suggested')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body.length).toBeLessThanOrEqual(3);
});

test("GET /api/videos/:username", async () => {
    const res = await request(app)
        .get(`/api/videos/${user.username}`)
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
});

test('GET /api/videos/reel/:id should return one video', async() => {
    const res = await request(app)
        .get(`/api/videos/reel/${video._id}`)
        .set('Cookie', cookie);

    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('_id');
});

test('POST /api/videos/save should save a video in the database', async () => {
    const res = await request(app)
        .post('/api/videos/save')
        .send({ text: 'test', video: video.video, publicId: video.publicId})
        .set('Accept', 'application/json')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('video');
});

test('PUT /api/videos/like/:id should like/unlike video', async () => {
    const res = await request(app)
        .put(`/api/videos/like/${video._id}?lang=en`)
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBeOneOf(["Video unliked successfully!", "Video liked successfully!"]);
});

test('PUT /api/videos/reply/:id should reply to a video/reel', async () => {
    const res = await request(app)
        .put(`/api/videos/reply/${video._id}?lang=en`)
        .send({ text: 'test reply' })
        .set('Accept', 'application/json')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.userId).toBe(user._id.toString());
});

test('DELETE /api/videos/delete/:id should return an error as failed to delete video because there are no valid publicId to use with cloudinary', async () => {
    const res = await request(app)
        .delete(`/api/videos/delete/${video._id}?lang=en`)
        .set('Cookie', cookie);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Failed to delete video!');
});