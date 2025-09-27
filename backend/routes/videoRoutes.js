import express from 'express';
import { deleteReel, getFeedVideos, getReelVideo, getSignature, getSuggestedReels, getUserVideos, likeOrUnlikeVideo, replyToVideo, saveVideo } from '../controllers/videoController.js';
import protectRoute from '../middlewares/protectRoute.js';

const router = express.Router();

router.get('/get-signature/:type', protectRoute, getSignature);
router.get('/', protectRoute, getFeedVideos);
router.get('/suggested', protectRoute, getSuggestedReels);
router.get('/:username', getUserVideos);
router.get('/reel/:id', getReelVideo);
router.post('/save', protectRoute, saveVideo);
router.put('/like/:id', protectRoute,  likeOrUnlikeVideo); // toggle action
router.put('/reply/:id', protectRoute, replyToVideo);
router.delete('/delete/:id', protectRoute, deleteReel);

export default router;