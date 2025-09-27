import supertest from "supertest";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import bcrypt from "bcryptjs";
import app from "../app.js";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, beforeAll, afterEach, beforeEach, expect, test } from "vitest";

dotenv.config({ path: '.env.test' });

const request = supertest.default || supertest;

let mongoServer;
let cookie;
let post;
let user;

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
        password: hashedPass
    });

    const user2 = await User.create({
        name: "Ahmed",
        username: 'ahmed_111',
        email: 'ahmed@email.com',
        password: hashedPass
    });

    const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'ali_212', password })
        .set('Accept', 'application/json');
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('_id');

    cookie = res.headers['set-cookie'][0];
    expect(cookie).toBeDefined();

    post = await Post.create({
        postedBy: res.body._id,
        text: 'test post from testing files'
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

test('GET /api/posts/feed should return the feed posts for home page', async() => {
    const res = await request(app)
        .get('/api/posts/feed?page=1&limit=7')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('hasMore');
    expect(res.body).toHaveProperty('posts');
    expect(res.body.posts.length).toBeLessThanOrEqual(7);
});

test('GET /api/posts/:id should return a one post', async () => {
    const res = await request(app)
        .get(`/api/posts/${post._id}`);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.postedBy).toHaveProperty('username');
    expect(res.body.postedBy.username).toBe('ali_212');
});

test("GET /api/posts/user/:username should return the user's posts", async () => {
    const res = await request(app)
        .get(`/api/posts/user/${user.username}?page=1&limit=5`);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('hasMore');
    expect(res.body).toHaveProperty('posts');
    expect(res.body.posts.length).toBeLessThanOrEqual(5);
});

test('POST /api/posts/create should create a post', async () => {
    const res = await request(app)
        .post('/api/posts/create')
        .send({ postedBy: user._id, text: 'test post'})
        .set('Accept', 'application/json')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('postedBy');
    expect(res.body.postedBy).toHaveProperty('username');
    expect(res.body.postedBy.username).toBe('ali_212');
});

test('POST /api/posts/repost/:pid should repost a post', async () => {
    const logoutRes = await request(app)
        .post('/api/users/logout')
        .set('Cookie', cookie);
    
    expect(logoutRes.status).toBeOneOf([200, 201]);

    const loginRes = await request(app)
        .post('/api/users/login')
        .send({ username: 'ahmed_111', password: '123456' })
        .set('Accept', 'application/json');
    
    expect(loginRes.status).toBeOneOf([200, 201]);
    const cookie2 = loginRes.headers['set-cookie'][0];
    expect(cookie2).toBeDefined();

    const res = await request(app)
        .post(`/api/posts/repost/${post._id}`)
        .send({ text: 'test to repost from testing files', postedBy: loginRes.body._id })
        .set('Accept', 'application/json')
        .set('Cookie', cookie2);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('repostedPost');
    expect(res.body.repostedPost).toHaveProperty('isReposted');
    expect(res.body.repostedPost.isReposted).toBe(true);
    expect(res.body.repostedPost).toHaveProperty('postedBy');
    expect(res.body.repostedPost.postedBy.username).toBe('ali_212');
});

test('POST /api/posts/repost/:pid should return an error says: you cannot repost your post', async () => {
    const res = await request(app)
        .post(`/api/posts/repost/${post._id}?lang=en`)
        .send({ text: 'test to repost', postedBy: user._id })
        .set('Accept', 'application/json')
        .set('Cookie', cookie);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe("You can't repost your post!")
});

test('DELETE /api/posts/:id should delete a post', async () => {
    const res = await request(app)
        .delete(`/api/posts/delete/${post._id}?lang=en`)
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBe('Post deleted successfully!');
});

test('PUT /api/posts/like/:id should like/unlike a post', async () => {
    const res = await request(app)
        .put(`/api/posts/like/${post._id}?lang=en`)
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBeOneOf(["Post unliked successfully", "Post liked successfully"]);
});

test('PUT /api/posts/reply/:id should reply to post', async () => {
    const res = await request(app)
        .put(`/api/posts/reply/${post._id}`)
        .send({ text: 'test reply from testing files' })
        .set('Accept', 'application/json')
        .set('Cookie', cookie);

    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('userId');
    expect(res.body.userId).toBe(user._id.toString());
});