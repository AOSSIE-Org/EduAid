import userModel from '../models/user.models.js';
import redisService from '../services/redis.service.js';
import * as serviceUser from '../services/user.services.js';
import { validationResult } from 'express-validator';
export const CreateControlUser=async(req,res)=>{
const errors=validationResult(req);
if(!errors.isEmpty()){
    return res.status(400).json({errors:errors.array()})
}try {
   const user=await serviceUser.createUser(req.body);
   const token=await user.generateJWT();
   delete user._doc.password
   res.status(201).json({user,token}); 
} catch (error) {
    console.log(error)
}
}
export const loginControluser=async(req,res)=>{
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:erros.array()});
    }
    try {
        const {email,password}=req.body;
        const user=await userModel.findOne({email}).select("+password");
        if(!user){
            return res.status(400).json({msg:"User Not Found"})
        }
        const isMatch=await user.matchpassword(password);
        if(!isMatch){
            return res.status(400).json({msg:"Invalid Credentials"})
        }
        const token=await user.generateJWT();
        delete user._doc.password
        res.status(200).json({user,token});
    } catch (error) {
        
    }
}
export const profileControlUser=async(req,res)=>{
    console.log(req.user)
   res.status(200).json({user:req.user})
}
export const logoutControluser=async(req,res)=>{
    try {
       const token=req.cookies.token || req.headers.authorization.split(" ")[1];
       redisService.set(token,'logout','EX',60*60*24);
       res.status(200).json({msg:"logout Successfully"}) 
    } catch (error) {
        res.status(404).json({msg:"User not Found"});
    }
}