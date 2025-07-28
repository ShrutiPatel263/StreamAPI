// what is asyncHandler?

// In backend development—especially in Node.js with Express.js—asyncHandler is a utility function used to handle errors in asynchronous route handlers or middleware. It makes your code cleaner and prevents you from writing repetitive try-catch blocks in every async function.

// asyncHandler is a higher-order function that wraps your async function and automatically catches errors and passes them to Express’s built-in error handler using next().

//Promise method

const asyncHandler=(requestHandler)=>{
   return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

export {asyncHandler}

//HigherOrder function 

//Try catch method 

// const asyncHandler=(fn)=>async (req,res,next)=>{
//     try{
//         await fn(req,res,next)
//     }catch(error){
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }
// } 