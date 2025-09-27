import dotenv from 'dotenv';
dotenv.config();

import connectDB from "./db/connectDB.js";
import http from 'http';
import app from './app.js';
import { initSocketServer } from './socket/socket.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
    try {
        await connectDB();
        const server = http.createServer(app);
        
        const io = initSocketServer(server);
        app.locals.io = io; // to be abble to use io inside messageController by req.app.locals.io
        
        server.listen(PORT, () => console.log(`server started at port ${PORT}`));
    } catch (error) {
        console.log('Error starting server: ', error);
        process.exit(1)
    }
};

start();