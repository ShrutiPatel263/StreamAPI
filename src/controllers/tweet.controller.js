import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    const {content} = req.body

    if(!content){
        throw new ApiError(400,"Description is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user._id  //if user is authenticated
    })

    if(!tweet){
        throw new ApiError(400,"Tweet is not created")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"Tweet created successfully")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets

    const {userId}=req.params

    if(!userId){
        throw new ApiError(404,"User not found")
    }

    const usersAllTweet=await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $addFields:{
                owner:{ $arrayElemAt: ["$owner", 0] } 
            }
        },
        {
            $project:{
                content:1,
                createdAt:1
            }
        }
    ])

    if(!usersAllTweet){
        throw new ApiError(400,"Something went wrng while fetching the tweets of all user")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,usersAllTweet,"All tweet of user fetched successfully")
    )


})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet

    const { tweetId } = req.params
    const {content} =req.body

    if(!tweetId){
        throw new ApiError(400,"Tweet not found")
    }

    if(!content){
        throw new ApiError(400,"Descriptiion is required")
    }

    const updatedtweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },{new:true}
    )
    
    if(!updatedtweet){
        throw new ApiError(404,"Tweet can not be updated")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedtweet,"Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet

    const { tweetId } = req.params

    if(!tweetId){
        throw new ApiError(400,"No tweet found")
    }

    const deletedTweet=await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet){
        throw new ApiError(400,"tweet can't be deleted")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,deletedTweet,"Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}