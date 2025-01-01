import Redis from "ioredis";
import dotenv from 'dotenv';

dotenv.config();

const redisService = new Redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

redisService.on("connect", () => {
    console.log("Redis Connected");
    
});

redisService.on("error", (err) => {
    console.log("Error connecting to Redis:", err);
});

export default redisService;
