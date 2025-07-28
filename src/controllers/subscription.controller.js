import mongoose, {isValidObjectId, Mongoose} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!channelId){
        throw new ApiError(404,"Channel not found")
    }

    const userId=req.user._id

    const IsSubscribed=await Subscription.findOne({
        subscriber:userId,
        channel:channelId
    })

    if(IsSubscribed){
     await Subscription.findOneAndDelete({
       subscriber: userId,
       channel: channelId
     });

        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Unsubscribed successfully")
        )
    }else{
        const subscriber=await Subscription.create({
            subscriber:userId,
            channel:channelId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200,subscriber,"Subscribed successfully")
        )
    }

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;  //Change

  if (!subscriberId || !isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid or missing channelId");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId) //Match the channel
      }
    },
    {
      $lookup: {
        from: "subscriptions",             
        localField: "subscriber",    
        foreignField: "_id",
        as: "subscriber"
      }
    },
    {
      $addFields: {
        subscriber: { $arrayElemAt: ["$subscriber", 0] } // flatten array
      }
    },
    {
      $project: {
        _id: 0,
        "subscriber._id": 1,
        "subscriber.username": 1,
        "subscriber.fullname": 1,
        "subscriber.avatar": 1,
        subscribedAt: "$createdAt"
      }
    }
  ]);

  return res
  .status(200)
  .json(
    new ApiResponse(200, subscribers, "Channel subscribers fetched successfully")
  );
});


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params; //channel id 

  if (!channelId) {
    throw new ApiError(404, "Subscriber Id not found");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId)
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails"
      }
    },
    {
      $unwind: "$channelDetails" // to convert array to single object
    },
    {
      $project: {
        _id: 0,
        channelId: "$channelDetails._id",
        username: "$channelDetails.username",
        fullname: "$channelDetails.fullname",
        avatar: "$channelDetails.avatar"
      }
    }
  ]);

  res.status(200).json(
    new ApiResponse(200, subscribedChannels, "Fetched subscribed channels successfully")
  );
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}