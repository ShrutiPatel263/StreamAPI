import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const getVideoComments = asyncHandler(async (req, res) => {
  // Extract videoId from URL and page/limit from query
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Validate videoId
  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid or missing videoId");
  }

  // Aggregation pipeline to fetch comments for that video
  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId) // filter comments for the given video
      }
    },
    {
      $sort: { createdAt: -1 } // newest first
    },
    {
      $skip: (Number(page) - 1) * Number(limit) // skip for pagination
    },
    {
      $limit: Number(limit) // limit the number of comments per page
    },
    {
      $lookup: {
        from: "users",            // join with users
        localField: "owner",   
        foreignField: "_id",
        as: "owner"
      }
    },
    {
      $addFields: {
        owner: { $arrayElemAt: ["$owner", 0] } // flatten the array
      }
    },
    {
      $project: {
        description: 1,
        createdAt: 1,
        "commentedBy._id": 1,
        "commentedBy.username": 1,
        "commentedBy.avatar": 1
      }
    }
  ]);

  // Get total count of comments for frontend pagination
  const totalComments = await Comment.countDocuments({
    video: videoId
  });

  return res
  .status(200)
  .json(
    new ApiResponse(200, 
      comments,
     "Comments fetched successfully")
  );
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content} = req.body
    
    if(!content){
        throw new ApiError(400,"Description is required")
    }

    const comment=await Comment.create({
        content,
        // video: VideoId,
        // user: req.user._id 
    })

    if(!comment){
        throw new ApiError(400,"Comment can't be created")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"Comment is created successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId}=req.params

    const{content}=req.body

    if(!commentId){
        throw new ApiError(400,"No commentId found")
    }

    if(!content){
        throw new ApiError(400,"description is required")
    }

    const updatedComment=await Comment.findByIdAndUpdate(
        commentId,
        {
           $set:{
            content
           }
        },{new:true}
    )
   
    if(!updatedComment){
        throw new ApiError(400,"Can't upadte the comment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedComment,"Comment updated successfully")
    )
    
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId}=req.params

    if(!commentId){
        throw new ApiError(400,"No comment found")
    }

    const deletedComment=await Comment.findByIdAndDelete(commentId)

    if(!deletedComment){
        throw new ApiError(400,"Something went wrong while deleting the cooment")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,deletedComment,"Comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}