import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "100kb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "100kb",
  })
);
app.use(cookieParser());
app.use(express.static("Public"));

import userrouter from "./routes/user.routes.js";
app.use("/api/user", userrouter);

export { app }; 