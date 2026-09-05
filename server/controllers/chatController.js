//POST / api/projects/:id/chat
//send revesion prompt amnd return upadted project

import { Project } from "../models/ProjectSchema.js";
import { reviseProject } from "../services/ai.js";
import { applyOperations } from "../services/diff.js";

export async function buildManifest(files) {
    const manifest = [];
    for (const [path, entry] of Object.entries(files)) {
        manifest.push({
            path,
            size: entry.content.length,
            hash: entry.hash,

        })
    }
    return manifest;

}
export async function chat(req, res) {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({
            message: "Prompt is required"
        })
    }

    if (!req.user) {
        return res.status(401).json({
            message: "Unauthorized"
        })
    }

    const project = await Project.findOneAndUpdate({ _id: req.params.id, owner: req.user.userId })
    if (!project) {
        return res.status(404).json({
            message: "Project not found"
        })
    }
    //set status to revising and save user prompt immediately
    project.status = "revising";
    project.message.push({ role: "user", content: prompt, timeStamp: Date.now() });
    await project.save();
    try {
        const manifest = await buildManifest(project.files);
        //include all files content so ai can accurate serach and replace
        const relevantFiles = {};
        for (const [path, content] of Object.entries(project.files)) {
            relevantFiles[path] = content.content;
        }
        //recent message
        const recentMessage = project.message.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,

        }));
        console.log(`[AI] Revising project ${project._id}: "${prompt.slice(0.80)}..." ` + ` (${manifest.length} files,   manifest ~${JSON.stringify(manifest.length)} chars)`);
        //Call AI with manifest + relevant files
        //set status to generating
        const result = await reviseProject(prompt, manifest, relevantFiles, recentMessage);
        console.log(`Result: ${result.operations.length} and description ${result.description}`);
        const { files: updatedFiles, applied, errors } = applyOperations(project.files, result.operations);


        if (errors.length > 0) {
            console.warn(`[Diff] error applyuing operations`, errors)
        }

        project.files = updatedFiles;
        project.status = "completed";
        project.markModified('files');
        project.version = 1;
        project.message.push({
            role: "ai",
            content: result.description || `Updated ${applied.length} files`,
            applied
        })
        await project.save();
        const filesObj = {};
        for (const [path, entry] of Object.entries(project.files)) {
            filesObj[path] = entry.content
        }
        res.json({
            _id: project._id,
            status: project.status,
            files: filesObj,
            name: project.name,
            message: project.message,
            version: project.version,
            description: project.description,
            applied,
            errors,
            aiDescription: result.description || null,
        })



    } catch (error) {
        console.error("Build error", error);
        project.status = "completed";
        project.save();
        res.status(500).json({
            error: error.message,
            message: "failed to process"
        })
    }


}