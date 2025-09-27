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
let user;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer?.getUri();

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
        pushSubscription: {
            endpoint: "test",
            keys: {
                auth: "test",
                p256dh: "test",
            }
        }
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

test('POST /api/notification/subscribe should subscribe to web push services', async () => {
    const subscription = {
        endpoint: 'testendpoint',
        keys: {
            auth: "testauth",
            p256dh: "testp256dh"
        }
    };

    const res = await request(app)
        .post('/api/notification/subscribe')
        .send({ subscription })
        .set('Accept', 'application/json')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBe('Subscribed successfully!');
});

test('POST /api/notification/send should send a notification to another user', async () => {
    const payload = { 
        title: 'New Message', 
        body: `You have a new message from ${user.username}`,
    };

    const res = await request(app)
        .post('/api/notification/send?lang=en')
        .send({ payload, userId: user._id })
        .set('Accept', 'application/json')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBe('notification sent!')
});