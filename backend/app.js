import express from 'express';
import cookieParser from "cookie-parser";
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";

const app = express();

//Middlewares
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(cookieParser());
app.use(cors({
    origin: ["http://localhost:3000", "https://d313oyzovamctv.cloudfront.net", "http://www.sharex.com.s3-website-us-east-1.amazonaws.com "],
    methods: ["GET", "POST"],
    credentials: true
}));

//Routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api", notificationRoutes);
app.use('/api/videos', videoRoutes);
app.use('/health', (req, res) => {
    return res.sendStatus(200);
});

// Reactive the bellow code to run the application on the same port:5000 && run the code: "npm start" from the root
/*const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.use((req, res, next) => {
    res.sendFile(path.join(__dirname, "../frontend/dist", "index.html"));
});*/

export default app;