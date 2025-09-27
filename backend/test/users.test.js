import supertest from "supertest";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import app from "../app.js";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, beforeEach, expect, test } from "vitest";

dotenv.config({ path: '.env.test' });

const request = supertest.default || supertest;

let mongoServer;

let cookie;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
});

afterEach(async () => {
    const collections = Object.keys(mongoose.connection.collections);
    for(const key of collections){
        await mongoose.connection.collections[key].deleteMany({});
    };
});

beforeEach(async () => {
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const user = await User.create({
        name: 'Ali',
        username: 'ali_212',
        email: 'ali@email.com',
        password: hashedPass,
    })

    const user2 = await User.create({
        name: 'Test User',
        username: 'test_111',
        email: 'test@email.com',
        password: hashedPass,
    })

    const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'ali_212', password })
        .set('Accept', 'application/json');

    expect(res.status).toBeOneOf([200,201]);
    
    cookie = res.headers['set-cookie'][0];
    expect(cookie).toBeDefined();
})

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
});

test('GET /api/users/profile/:username|_id should get the profile of the user', async () => {
    const res = await request(app)
        .get('/api/users/profile/ali_212')
        .set('Accept', 'application/json');
    
    expect(res.status).toBeOneOf([200, 201]);
    
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('username');
    expect(res.body).toHaveProperty('bio');
    expect(res.body).toHaveProperty('profilePic');
    expect(res.body).toHaveProperty('lang');

    expect(res.body.name).toBe('Ali');
    expect(res.body.email).toBe('ali@email.com');
    expect(res.body.username).toBe('ali_212');
});

test('GET /api/users/allusers should return all users', async () => {
    const res = await request(app)
        .get('/api/users/allusers')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);

    expect(res.body[0]).toHaveProperty('_id');
});

test('GET /api/users/suggested should return a sample of the users', async () => {
    const res = await request(app)
        .get('/api/users/suggested')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);

    expect(res.body[0]).toHaveProperty('_id');
    expect(res.body.length).toBeLessThanOrEqual(4);
});

test('POST /api/users/follow/:id should follow user', async () => {
    const res1 = await request(app)
        .get('/api/users/profile/test_111');
    
    expect(res1.status).toBeOneOf([200, 201]);
    expect(res1.body).toHaveProperty('_id');
    const userId = res1.body._id;

    const res = await request(app)
        .post(`/api/users/follow/${userId}`)
        .set('Accept', 'application/json')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('message');
});

test('PUT /api/users/update/:id should update user', async () => {
    const res1 = await request(app)
        .get('/api/users/profile/ali_212')
    
    expect(res1.status).toBeOneOf([200, 201]);
    expect(res1.body).toHaveProperty('_id');

    const userId = res1.body._id;
    
    const res = await request(app)
        .put(`/api/users/update/${userId}`)
        .send({ name: 'Ali Ahmed', username: 'ali_212' })
        .set('Accept', 'application/json')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('_id');

});

test('PUT /api/users/freeze', async () => {
    const res = await request(app)
        .put('/api/users/freeze')
        .set('Cookie', cookie);
    
    expect(res.status).toBeOneOf([200, 201]);
    expect(res.body).toHaveProperty('success');
    expect(res.body.success).toBe(true);
});