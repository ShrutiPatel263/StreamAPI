import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name || !description){
        throw new ApiError(400,"Name and description is required")
    }

    const playlist=await Playlist.create({
        description,
        name
    })

    if(!playlist){
        throw new ApiError(400,"Playlist not created")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist is created")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!userId){
        throw new ApiError(404,"UserId not found")
    }

    const playlist=await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"

            }   
        },{
            $addFields:{
                owner:{$arrayElemAt :["$owner",0]}
            }
        },

        {
            $project:{
                description:1,
                name:1,
                owner:1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!playlistId){
        throw new ApiError(400,"Playlist not found")
    }

    const playlist=await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400,"Something went wrong while creating playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId){
        throw new ApiError(404,"Playlist not found")
    }

    if(!videoId){
        throw new ApiError(404,"video not found")
    }

    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{
                videos:videoId
            }
        }
        ,{new:true}
    )

    if(!updatedPlaylist){
        throw new ApiError(400,"Something went wrong while added video to playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,updatedPlaylist,"New video added successfully in playlist"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    
    if(!playlistId){
        throw new ApiError(404,"Playlist not found")
    }

    if(!videoId){
        throw new ApiError(404,"Video not found")
    }

    const updatedPlayist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos:videoId
            }
        },{new:true}
    )

    if(!updatedPlayist){
        throw new ApiError(400,"Something went wrong while removing the video from playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedPlayist,"Video removed from playlist successfully")
    )


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!playlistId){
        throw new ApiError(404,"Playlist not found")
    }

    const deletedPlaylist=await Playlist.findByIdAndDelete(playlistId)

    if(!deletedPlaylist){
        throw new ApiError(400,"Something went wrong while deleting playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,deletedPlaylist,"Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist


    if(!playlistId){
        throw new ApiError(404,"Playlist not found")
    }

    if(!name && !description){
        throw new ApiError(404,"name or description is required")
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();


    const updatedPlaylist=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
              updateData
            }
        },{new:true}
    )

    if(!updatedPlaylist){
      throw new ApiError(400,"something went wrong while updating the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,updatedPlaylist,"Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}