import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { Mongoose } from "mongoose";


const generateAccessAndRefereshTokens = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}


const registerUser=asyncHandler(async (req,res)=>{

    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
   
  const{fullname,username,email,password}=req.body;
  console.log("email : ",email);

  //We can check like this one by one for each feild
  // if(fullname === ""){
  //   throw new ApiError(400,"Please enter full name")
  // } 
  
  //2nd option
  if(
    [fullname,username,email,password].some((feild) =>
       feild?.trim()===""
    )
  ){
     throw new ApiError(400,"All feilds are required")
  }

  const existedUser=await User.findOne({
    $or:[{username},{email}]
  })

  if(existedUser){
    throw new ApiError(409,"User with email or username already exist")
  }

     const avatarLocalPath = req.files?.avatar[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }


  const user=await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase(),
  })

   const createdUser= await User.findById(user._id).select(
    "-password -refreshToken"                                //Mention the field which we don,t want to select
   )
   

   if (!createdUser){
    throw new ApiError(500,"Something went wrong while registering the user")
   }

   return res.status(201).json(
     new ApiResponse(200,createdUser,"User registered successfully")
   );

})

const LoginUser=asyncHandler(async (req,res) =>{
  //req body-->data
  //username or email
  //find the user 
  //password check
  //access & refreshtoken
  //send cookie
  //send response successfully loggedin 

  const { username,email,password } = req.body;

  if(!username && !email){
    throw new ApiError(400,"username or email is required")
  }

  const user=await User.findOne({
    $or:[{username},{email}]
  })

  if(!user){
    throw new ApiError(404,"User not found")
  }

  const isPasswordValid=await user.isPasswordCorrect(password)


    if(!isPasswordValid){
    throw new ApiError(401,"Password incorrect")
  }

    const {accessToken,refreshToken}= await generateAccessAndRefereshTokens(user._id)


    const loggedInUser=await User.findById(user._id).select("-password -refreshtoken")

    const options={
      httpOnly:true,
      secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
        200,{
          user:loggedInUser,accessToken,refreshToken
        },
        "User logged in successfully"
      )
    )

})

const logoutUser=asyncHandler(async (req,res) =>{
  //Remove cookies
  //Remove refreshToken
  User.findByIdAndUpdate(
    req.user._id,
    {
      $unset:{
        refreshToken:1//this removes the feild from document
      }
    },
    {
      new:true 
    }
  )

  const options ={
    httpOnly:true,
    secure:true
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logged Out"))

})

const refreshAccessToken  = asyncHandler(async (req,res)=>{
   const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

   if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")
   }

   try {
    const decodedToken = jwt.verify(
     incomingRefreshToken,
     process.env.ACCESS_TOKEN_SECRET
    )
 
    const user = await User.findById(decodedToken?._id)
 
    if(!user){
      throw new ApiError(401,"Invalid RefreshToken")
    }
 
    if(incomingRefreshToken !== user?.refreshToken){
     throw new ApiError(401,"Refresh  token is expired or used")
    }
 
    const options={
     httpOnly:true,
     secure:true
    }
 
    const {accessToken,newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
 
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
     new ApiResponse(
       200,
       {accessToken,refreshToken : newRefreshToken},
       "New Access token generated"
     )
    )
   } catch (error) {
     throw new ApiError(401,error?.message || "Invalid refreshToken")
   }

})

const changeCurrentPassword = asyncHandler(async (req,res)=>{
  const {oldPassword,newPassword,confirmPassword}=req.body

  const user=await User.findById(req.user?._id)
  const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid Old Password")
  }

  if(newPassword !== confirmPassword){
    throw new ApiError(400,"Password not matched")
  }

  user.password=newPassword
  await user.save({validateBeforeSave :false})

  return res
  .status(200)
  .json(
    new ApiResponse(200,
      {},
      "Password changed successfully"
    )
  )
})

const getCurrentUser=asyncHandler(async (req,res)=>{
  return res
  .status(200)
  .json(
    new ApiResponse(200,req.user,"Current user fetched successfully")
  )
})

const updateAccountDetails=asyncHandler(async (req,res)=>{
  const {username} = req.body

  if(!username){
    throw new ApiError(400,"Please enter Username")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        username
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"Accout detalis are updated successfully")
  )

})

const updateUserAvatar=asyncHandler(async (req,res)=>{
  const avatarLocalPath=req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"Avatar updated successfully")
  )

})

const updateUserCoverImage=asyncHandler(async (req,res)=>{
   const coverImageLocalPath=req.file?.path

   if(!coverImageLocalPath){
    throw new ApiError(400,"Cover Image is missing")
   }

   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage){
    throw new ApiError(400,"error while uploading cover image on cloud")
   }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}
  ).select("-password")  

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"CoverImage Updated successfully")
  )
})

const getUserChannelProfile=asyncHandler(async (req,res)=>{
   const {username}=req.params

   if(!username?.trim()){
    throw new ApiError(400,"username is missing")
   }

   const channel=await User.aggregate([
    
    //count uses
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    //user subscribers
    {
      $lookup:{
        from:"subscriptions",  //Database:Subscription store as subscriptions
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    //howmany channel subscribed by user
    {
      $lookup:{
        from:"subscriptions",  //Database:Subscription store as subscriptions
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    //add 2 fields and manage subscribe or subscribed display
    {
      $addFields:{
        subscribersCount:{
            $size:"$subscribers"
        },
        channelsSubscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed :{
          $cond:{
            if:{$in : [req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },{
      $project:{
        fullname:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
        
      }
    }
   ])

   if(!channel?.length){
    throw  new ApiError(404,"channel does not exist")
   }

   return res
   .status(200)
   .json(
    new ApiResponse(200,channel[0],"User channel fetched successfully")
   )
})


const getWatchHistroy=asyncHandler(async (req,res)=>{
  const user=await User.aggregate(
    [
      {
        $match:{
          _id:new mongoose.Types.ObjectId(req.user._id)
        }
      },
      {
        $lookup:{
          from:"videos",
          localField:"watchHistroy",
          foreignField:"_id",
          as:"watchHistory",
          pipeline:[{
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                     fullname:1,
                     username:1,
                     avatar:1
                  }
                },
                {
                  $addFields:{
                    owner:{
                      $first:"$owner"
                    }
                  }
                }
              ]
            }
          }
         ]
        }
      }
    ]
  )

  return res
  .status(200)
  .json(
    new ApiResponse(200,user[0].watchHistroy,"Watch histroy fetched successfully")
  )
})

export {
  
  registerUser,
  LoginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistroy
} 