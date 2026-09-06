import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectToDB } from "./config/db.js";
import authRouter from "./routes/authroute.js";
import projectRouter from "./routes/projectRoutes.js";
const app = express();
connectToDB()
app.use(cors({ origin: process.env.ORIGINS.split(","), credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running")
})
app.use("/api/auth", authRouter);
app.use("/api/projects", projectRouter);

//centralized error handler 
app.use((err, req, res, next) => {
    console.log(`Error : ${err.message}`);
    res.status(500).json({ error: err.message })
})
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server is running http://localhost:${port}/`)
})