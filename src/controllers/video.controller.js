import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {

 //    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
//     TODO*: get all videos based on query, sort, pagination

  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId
  } = req.query;

  const matchStage = {
    isPublished: true,
    title: { $regex: query, $options: "i" }
  };

  if (userId) {
    matchStage.owner = new mongoose.Types.ObjectId(userId);
  }

  const sortStage = {};
  sortStage[sortBy] = sortType === "asc" ? 1 : -1;

  const videos = await Video.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner"
      }
    },
    {
      $addFields: {
        owner: { $arrayElemAt: ["$owner", 0] }
      }
    },
    {
      $project: {
        title: 1,
        thumbnail: 1,
        views: 1,
        createdAt: 1,
        duration: 1,
        "owner.username": 1,
        "owner.fullname": 1,
        "owner.avatar": 1
      }
    },
    { $sort: sortStage },
    { $skip: (Number(page) - 1) * Number(limit) },
    { $limit: Number(limit) }
  ]);

  const totalVideos = await Video.countDocuments(matchStage);

  return res
  .status(200)
  .json(
    new ApiResponse(200, videos,"Videos fetched successfully")
  );
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!title){
        throw new ApiError(400,"Title is required")
    }

    if(!description){
        throw new ApiError(400,"description is required")
    }

    const videoLocalPath=req.files?.videoFile[0]?.path;

    if(!videoLocalPath){
        throw new ApiError(400,"VideoLocal path not found")
    }

    const videofile = await uploadOnCloudinary(videoLocalPath)
    const videoDuration = videofile.duration;

    if(!videofile || !videoDuration){
        throw new ApiError(400,"Video is not available")
    }

    const thumbnailLocalPath=req.files?.thumbnail[0]?.path

    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnail is not availabel")
    }

    const thumbnail=await uploadOnCloudinary(thumbnailLocalPath)

    const video=await Video.create({
        videoFile:videofile.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:videoDuration
    })

    const publishedVideo=await Video.findById(video._id)

    if(!publishedVideo){
        throw new ApiError(400,"Something went wrong while publish a video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,publishedVideo,"Video publish successfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!videoId ||  !isValidObjectId(videoId)){
        throw new ApiError(401,"Video id is required")
    }

    const video=await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"Video not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"video is fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    //I will manage thumbnail update in other function

    const {title,description}=req.body

    if(!title || !description){
        throw new ApiError(400,"Title or description required")
    }

    if(!videoId ||  !isValidObjectId(videoId)){
        throw new ApiError(400,"Something went wrong with this video id")
    }

    const video=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                description
            }
        },
        {new:true}
    )

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    return res
    .status(200)
    .json(
        200,video,"Title and description updated successfully"
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!videoId ||  !isValidObjectId(videoId)){
        throw new ApiError(404,"video not found")
    }

    const deletedVideo=await Video.findByIdAndDelete(videoId)

    if(!deletedVideo){
        throw new ApiError(404,"Video not found for deletion")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,deleteVideo,"Video is successfully deleted")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400,"Video id wrong")
    }

    const video=await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"Video not found")
    }

    //toggle
    video.isPublished = !video.isPublished;
    await video.save();

    
    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Publish status toggle successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}