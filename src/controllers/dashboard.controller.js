import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(404, "Channel not found");
  }

  const objectId = new mongoose.Types.ObjectId(channelId);

  // 1. stats: totalVideos, totalViews
  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: objectId
      }
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" }
      }
    }
  ]);

  // 2.total likes across all videos
  const videoIds = await Video.find({ owner: objectId }).select("_id");

  const videoIdList = videoIds.map(video => video._id);

  const totalLikes = await Like.countDocuments({ video: { $in: videoIdList } });

  // 3.total subscribers
  const totalSubscribers = await Subscription.countDocuments({ channel: objectId });

  const stats = {
    totalVideos: videoStats[0]?.totalVideos || 0,
    totalViews: videoStats[0]?.totalViews || 0,
    totalLikes: totalLikes || 0,
    totalSubscribers
  };

  res.status(200).json(
    new ApiResponse(200, stats, "Channel statistics fetched successfully")
  );
});


const getChannelVideos = asyncHandler(async (req, res) => {

    //TODO: get all vodeos of channel
    
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(404, "Channel ID is required");
  }

  const allChannelVideos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
        isPublished: true 
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "channelDetails"
      }
    },
    {
      $unwind: "$channelDetails"
    },
    {
      $project: {
        _id: 1,
        title: 1,
        thumbnail: 1,
        duration: 1,
        views: 1,
        createdAt: 1,
        channel: {
          _id: "$channelDetails._id",
          username: "$channelDetails.username",
          avatar: "$channelDetails.avatar"
        }
      }
    },
    {
      $sort: { createdAt: -1 } // newest first
    }
  ]);

  res.status(200).json(
    new ApiResponse(200, allChannelVideos, "Fetched all channel videos")
  );
});


export {
    getChannelStats, 
    getChannelVideos
    }