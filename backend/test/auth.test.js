import supertest from "supertest";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import { MongoMemoryServer } from "mongodb-memory-server";
import { afterAll, afterEach, beforeAll, expect, test } from "vitest";
import app from '../app.js';
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";

dotenv.config({ path: '.env.test' });

const request = supertest.default || supertest;

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();

    await mongoose.connect(uri);
});

afterEach(async () => {
    const collections = Object.keys(mongoose.connection.collections);
    for(const key of collections) {
        await mongoose.connection.collections[key].deleteMany({});
    };
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
});

test('POST /api/users/signup should create a user', async () => {
    const payload = { name: 'Ali', email: 'ali@email.com', username: 'ali_212', password: '123456', lang: 'ar' };

    const res = await request(app)
        .post('/api/users/signup')
        .send(payload)
        .set('Accept', 'application/json');

    if(res.status !== 201){
        console.log('--- DEBUG: response status/body ---')
        console.log('status:', res.status)
        console.log('body:', res.body)
        console.log('text:', res.text)
    }
    
    expect(res.status).toBeOneOf([201, 200]);
    
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

test('POST /api/users/login should login with correct data', async () => {
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const user = await User.create({
        name: 'Ali',
        username: 'ali_212',
        email: 'ali@email.com',
        password: hashedPass,
    });

    const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'ali_212', password })
        .set('Accept', 'application/json')

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

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toBeDefined();
});

test('POST /api/users/login should return error as wrong password or username', async () => {
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const user = await User.create({
        name: 'Ali',
        username: "ali_212",
        email: 'ali@email.com',
        password: hashedPass
    });
    
    const res = await request(app)
        .post('/api/users/login?lang=en')
        .send({ username: 'ali_212', password: '1234567' })
        .set('Accept', 'application/json');

    expect(res.status).toBeOneOf([400, 404]);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Incorrect username or password!')
})

test('POST /api/users/logout should logout user', async () => {
    const password = '123456';
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    const user = await User.create({
        name: 'Ali',
        username: 'ali_212',
        email: 'ali@email.com',
        password: hashedPass,
    });

    const loginRes = await request(app)
        .post('/api/users/login')
        .send({ username: 'ali_212', password })
        .set('Accept', 'application/json');
    
    expect(loginRes.status).toBeOneOf([200, 201])
    const cookie = loginRes.headers['set-cookie'][0];
    expect(cookie).toBeDefined();

    const logoutRes = await request(app)
        .post('/api/users/logout')
        .set('Cookie', cookie);

    expect(logoutRes.status).toBeOneOf([200, 201]);

    const logoutCookie = logoutRes.headers["set-cookie"][0];
    expect(logoutCookie).toMatch(/jwt=;/);
});