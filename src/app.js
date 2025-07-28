import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app=express();


//MiddleWares
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended:true}));
app.use(express.static("public"));
app.use(cookieParser());

//routes import
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.routes.js'
import commentRouter from './routes/comment.route.js'
import playlistRouter from './routes/playlist.route.js'
import tweetRouter from './routes/tweet.route.js'
import dashboardRouter from './routes/dashboard.route.js'
import healthCheckRouter from './routes/healthcheck.route.js'
import likeRouter from './routes/like.route.js'
import subscriptionRouter from './routes/subscription.route.js'

//routes declaration  --here we can't use app.get
app.use("/api/v1/users",userRouter);   //http://localhost:3000/api/v1/users
app.use("/api/v1/videos",videoRouter);  
app.use("/api/v1/playlists",playlistRouter);    
app.use("/api/v1/comments",commentRouter);
app.use("/api/v1/tweets",tweetRouter);
app.use("/api/v1/likes",likeRouter)
app.use("/api/v1/dashboard",dashboardRouter);   
app.use("/api/v1/healthcheck",healthCheckRouter);
app.use("/api/v1/subscriptions",subscriptionRouter);

export {app} ;


