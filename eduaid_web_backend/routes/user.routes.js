import { Router } from "express";
import { LoginUser, RegisterUser } from "../Controller/user.controller.js";
const userrouter = Router();
console.log("aaya hu routes ");
userrouter.route("/Register").post(RegisterUser);
userrouter.route("/Login").post(LoginUser);
export default userrouter;
