import express from 'express';
import { restoreSubscribe, sendNotification } from '../controllers/notificationController.js';
import protectRoute from '../middlewares/protectRoute.js';

const router = express.Router();

router.post('/notification/subscribe', protectRoute, restoreSubscribe);
router.post('/notification/send',protectRoute, sendNotification);

export default router;