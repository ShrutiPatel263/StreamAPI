import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(404,"Video not found")
    }
    
    const userId=req.user._id;

    const existingLikes=await Like.findOne({
        video:videoId,
        likedBy:userId
    })

    if(existingLikes){
        //Already liked then remove like
        await Like.findByIdAndDelete(existingLikes._id)

        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Video unlike successfully")
        )
    }else {
    // Not liked yet then add new like
    const like = await Like.create({
      video: videoId,
      likedBy: userId
    });

    return res.status(200).json(
      new ApiResponse(200, like, "Video liked successfully")
    );
  }
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment


    if(!commentId){
        throw new ApiError(404,"Comment not found")
    }

    const userId=req.user._id

    const existingLikes=await Like.findOne({
        comment:commentId,
        likedBy:userId
    })

    if(existingLikes){
        await Like.findByIdAndDelete(existingLikes._id)

        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Comment unlike successfully")
        )
    }else {
    // Not liked yet then add new like
    const like = await Like.create({
      comment: commentId,
      likedBy: userId
    });

    return res.status(200).json(
      new ApiResponse(200, like, "comment liked successfully")
    );
  }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    

    if(!tweetId){
        throw new ApiError(404,"tweet not found")
    }

    const {userId}=req.user._id

    const existingLikes=await Like.findOne({
        tweet:tweetId,
        likedBy:userId
    })

    if(existingLikes){
        await Like.findByIdAndDelete(existingLikes._id)

        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"tweet unlike successfully")
        )
    }else {
    // Not liked yet then add new like
    const like = await Like.create({
      tweet: tweetId,
      likedBy: userId
    });

    return res.status(200).json(
      new ApiResponse(200, like, "tweet liked successfully")
    );
  }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const {userId}=req.params

    if(!userId){
        throw new ApiError(404,"User not found")
    }

    const likedVideos=await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId)
            }
        },
        {
           $lookup:{
             from:"videos",
             localField:"video",
             foreignField:"_id",
             as:"video"
           }

        },
        {
            $unwind: "$video" // Flatten video array
        },
        {
            $project:{
              _id: 0,
             video: {
               title: 1,
               thumbnail: 1,
               duration: 1,
               views: 1,
               createdAt: 1
             }
           }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,likedVideos,"Liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}