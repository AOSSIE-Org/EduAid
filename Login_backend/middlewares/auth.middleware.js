import jwt from "jsonwebtoken";
import redisService from "../services/redis.service.js";
export const authUser =async (req,res,next)=>{
    try {
       const token=req.cookies.token || req.headers.authorization.split(" ")[1];
       if(!token){
        return res.status(401).json({msg:"No token found"});
       }
       const isBlackListed=await redisService.get(token);
       if(isBlackListed){
         res.cookie('token','')
         return res.status(401).json({msg:"Unauthorized User"})
       }
       const decoded=jwt.verify(token,process.env.JWT_SECRET)
       req.user=decoded;
       next();

    } catch (error) {
       res.status(404).send({error:"Not authrized"}) 
    }
}