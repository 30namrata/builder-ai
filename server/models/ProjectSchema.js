import mongoose from "mongoose";
import { Schema } from "mongoose";

const MessageSchema = new Schema({
    content: { type: String, require: true },
    role: { type: String, enum: ["user", "assistant"], require: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
}, { _id: false });

const PlannedFilesSchema = new Schema({
    path: { type: String, require: true },
    description: { type: String, default: "" }
}, { _id: false })



const ProjectSchema = new Schema({
    name: { type: String, require: true, default: "Unititled Project" },
    description: { type: String, default: "" },
    files: { type: Schema.Types.Mixed, default: {} },
    publish: { type: Boolean, default: false },
    message: { type: [MessageSchema], default: [] },
    version: { type: Number, default: 0 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["pending", "generating", "revising", "completed", "failed"], default: "pending" },
    filesPlanned: { type: [PlannedFilesSchema], default: [] },
    filesGenerated: { type: [String], default: [] },
    currentFile: { type: String, default: null },
    error: { type: String, default: null }

}, { timestamps: true });


export const Project = mongoose.model("Project", ProjectSchema);
