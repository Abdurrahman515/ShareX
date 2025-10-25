import express from "express";
import { checkUserAuth, followUnFollowUser, freezeAccount, getAllUsers, getSuggestedUsers, getUserProfile, loginUser, logoutUser, signupUser, updateUser } from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";

const router = express.Router();

router.get("/profile/:query", getUserProfile);
router.get("/allusers", protectRoute, getAllUsers);
router.get("/suggested", protectRoute, getSuggestedUsers);
router.get("/checkauth", checkUserAuth);
router.post("/signup", signupUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/follow/:id", protectRoute, followUnFollowUser);
router.put("/update/:id", protectRoute, updateUser);
router.put("/freeze", protectRoute, freezeAccount);

export default router;