import {Router} from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistroy, LoginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()


router.route("/register").post(
    
   upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
    {

        name:"coverImage",
        maxCount:1
    }
   ]) ,registerUser) //http://localhost:3000/api/v1/users/register


router.route("/login").post(LoginUser)   //http://localhost:3000/users/login

//secure routes
router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").get(verifyJWT,getCurrentUser)

router.route("/updateAccountDetails").post(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)

router.route("/cover-Image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage) 

router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistroy)








export default router

