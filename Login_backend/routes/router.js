import { Router } from "express";
import * as userController from '../controllers/user.controller.js';
import { body } from "express-validator";
import * as authmiddleware from "../middlewares/auth.middleware.js"
const router=Router();
router.post('/register',body('email').isEmail().withMessage("Email must be valid"),body('password').isLength({min:3}).withMessage("Password must be 3 character long"),userController.CreateControlUser);
router.post('/login',body('email').isEmail().withMessage("Email must be valid"),body('password').isLength({min:3}).withMessage("Password must be 3 character long")
,userController.loginControluser)
router.get('/profile',authmiddleware.authUser,userController.profileControlUser)
router.get('/logout',authmiddleware.authUser,userController.logoutControluser)
export default router;