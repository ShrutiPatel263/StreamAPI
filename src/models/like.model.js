import mongoose,{Schema} from "mongoose";

const likeSchema=new Schema({

     video:{
      type:mongoose.Schema.Types.ObjectId,
      ref:"Video"
     },
     comment:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Comment"
     },
     likedBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
     },
     tweet:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Tweet"
     }
}, {timestamps:true})

export const Like=mongoose.model("Likes",likeSchema)