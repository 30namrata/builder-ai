import { User } from "../models/UserSchema.js";
import JWT from "jsonwebtoken";


const JWT_SECRET = process.env.SECRET_KEY || "fallback_secret";
//helper to set cookies
const setSessionCookies = (req, res, payload) => {
    const token = JWT.sign(payload, JWT_SECRET, { expiresIn: "30d" });
    const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER || req.headers.origin?.includes("vercel.app");
    res.cookie('token', token, {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction ? true : false,
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/"
    })
}
export async function register(req, res) {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: "name , email and password  are required" })
    }
    const trimEmail = email.trim().toLowerCase();

    const userExists = await User.findOne({ email: trimEmail });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" })
    }
    const user = await User.create({ name, email: trimEmail, password })

    setSessionCookies(req, res, { userId: user._id.toString(), email: user.email });

    res.status(201).json({
        userId: user._id,
        name: user.name,
        email: user.email
    })



}

export async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "email and password  are required" })
    }
    const trimEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
        return res.status(400).json({ message: "User not exists" })
    }
    const userValid = await user.comparePassword(password);
    if (!userValid) {
        return res.status(400).json({ message: "Invalid password" })
    }

    setSessionCookies(req, res, { userId: user._id.toString(), email: user.email });

    res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email
    })
}

export async function logout(req, res) {
    const isProduction = process.env.NODE_ENV === "production" || process.env.RENDER || req.headers.origin?.includes("vercel.app");
    res.cookie("token", "", {
        httpOnly: true,
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction ? true : false,
        maxAge: 0,
        path: "/"
    })
    res.json({ success: true })
}

export async function me(req, res) {

    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" })
        return;

    }
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) {
        return res.status(404).json({ message: "User not found" })
    }
    return res.json({
        user
    })

}

