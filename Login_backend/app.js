import express, { urlencoded } from "express";
import dotenv from 'dotenv';
import Userouter from "./routes/router.js";
import cookieParser from "cookie-parser";
import cors from 'cors';
dotenv.config(); 

import morgan from "morgan";
import connectDB from "./db/db.js";
connectDB();
const app = express();
app.use(morgan("dev"))
app.use(cors());
app.use(express.json());
app.use(urlencoded({extended:true}))
app.use('/users',Userouter)
app.use(cookieParser());
export default app;
