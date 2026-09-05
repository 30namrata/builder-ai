//POST/api/project -> create a project

import { ReturnDocument } from "mongodb";
import { Project } from "../models/ProjectSchema.js";
import crypto from "crypto";
import { version } from "os";
import { generateProject } from "../services/ai.js";
import { timeStamp } from "console";


//hash file content
function hashContent(content) {
    return crypto.createHash("md5").update(content).digest("hex").slice(0, 12);
}

//CReate new project form ai prompt

export async function createProject(req, res) {
    const prompt = req.body;
    if (!prompt || typeof prompt !== "string") {
        res.status(400).json({
            message: "Prompt is required"
        })
        return
    }
    if (!req.user) {
        res.status(401).json({
            message: "Unauthorized"
        })
        return
    }
    const project = await Project.create({
        name: "Planning project",
        description: prompt,
        message: [{ role: "user", content: prompt },
        { role: "assistant", content: "Planning your project " }
        ],
        version: 0,
        owner: req.user.userId,
        status: "pending",
        files: {},
        filesPlaned: [],
        filesGenerated: [],
        currentFile: null,
        error: null

    })
    runBackgroundGenartion(project._id.toString(), prompt).catch((err) => {
        console.log(`[Background AI] Fatal error in project ${project._id.toString()} : ${err.message}`)
    })

    res.status(201).json({
        _id: project._id,
        status: project.status,
        name: project.name,
        description: project.description,
        files: {},
        message: project.message,
        owner: project.owner,
        filesPlaned: project.filesPlaned,
        filesGenerated: project.filesGenerated,
        currentFile: project.currentFile,
        error: project.error,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt


    })


};

//background worker to process and generate code
//GET/api/project/generate/{id}
async function runBackgroundGenartion(projectId, params) {
    try {
        console.log(`[Background AI] Starting genration for ${projectId}`);
        const result = await generateProject(prompt, {
            onPlan: async (plan) => {
                console.log(`[Background AI] Updating file plan for project ${projectId}. Planned ${plan.files.length} files`);
                const fileList = plan.files.map(f => `- \`${f.path}\`:${f.description}`).join("\n");
                await Project.findByIdAndUpdate(projectId, {
                    name: plan.projectName || "Generate Project",
                    status: "planning",
                    filesPlaned: plan.files,
                    $push: {
                        message: {
                            role: "assistant",
                            content: `Planned Website Structure:\n ${fileList}`,
                            timeStamp: Date.now(),
                        }
                    }
                })
            },
            onFileStart: async (path) => {
                console.log(`[Background AI] Generating: ${path}`);
                await Project.findByIdAndUpdate(projectId, {
                    status: "generating",
                    currentFile: path
                })
            },
            onFileComplete: async (path, code) => {
                console.log(`[Background AI] Completed: ${path} and ${projectId}`);
                const project = await Project.findOneAndUpdate(projectId);
                if (project) {
                    project.files = project.files || {}
                    project.files[path] = { content: code, hash };
                    project.filesGenerated = [...(project.filesGenerated || []), path];
                    project.message.push({ role: "assistant", content: `Created path ${path}`, timestamp: Date.now() });
                    project.currentFile = null;
                    project.markModified('files');
                    await project.save();

                }

            },

        });
        console.log(`[Background AI] Completed project ${projectId}`);
        const project = await Project.findByIdAndUpdate(projectId);
        if (project) {
            project.status = "completed";
            project.version = 1;
            if (result.description) {
                project.description = result.description
            }
            project.message.push({ role: "assistant", content: "Project generation completed successfully", timestamp: Date.now() })
            await project.save();
        }

    }
    catch (error) {
        console.error(`[Background AI] Error in project ${projectId}: ${error.message}`);
        await Project.findByIdAndUpdate(projectId, {
            status: "failed",
            error: error.message,
            currentFile: null,
            $push: {
                message: {
                    role: "assistant",
                    content: `❌ Project generation failed: ${error.message}`,
                    timestamp: Date.now(),
                }
            }

        })
    }
}




//GET api projects
//List of allowned project owned by the owner
export async function listProject(req, res) {
    if (!req.user) {
        res.status(401).json({
            message: "Unauthorized"
        })
        return
    }
    const projects = await Project.findOne(
        { owner: req.user.userId },
        { name: 1, version: 1, createdAt: 1, updatedAt: 1, description: 1 }
    ).sort({ updatedAt: -1 });

    res.json(projects)

}

//GET api projects/id
//List of allowned project owned by the owner
export async function getProject(req, res) {
    if (!req.user) {
        res.status(401).json({
            message: "Unauthorized"
        })
        return
    }
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.userId });
    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return
    }
    const filesObj = {};
    for (const [path, entry] of Object.entries(project.files)) {
        filesObj[path] = entry.content;

    }
    res.status(200).json({
        _id: project._id,
        name: project.name,
        description: project.description,
        files: filesObj,
        message: project.message,
        version: project.version,
        status: project.status,
        filesPlaned: project.filesPlaned,
        filesGenerated: project.filesGenerated,
        currentFile: project.currentFile,
        error: project.error,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
    })






}


//Delete project
export async function deleteProject(req, res) {
    if (!req.user) {
        res.status(401).json({
            message: "Unauthorized"
        })
        return
    }
    const result = await Project.findOneAndDelete({ _id: req.params.id, owner: req.user.userId });
    if (!result) {
        res.status(404).json({ message: "Project not found" });
        return
    }
    res.json({ success: true })

}


//PUT /ap/project/:id /files
//update the content of a file 


export async function updateProjectFiles(req, res) {
    const files = req.body;
    if (!files || typeof files !== "object") {
        res.status(400).json({ message: "Files are required" })
        return
    }
    if (!req.user) {
        res.status(401).json({
            message: "Unauthorized"
        })
        return
    }
    const project = await Project.findOne({ _id: req.params.id, owner: req.user.userId });
    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return
    }
    //Rebuild project files map with content
    const newfiles = {}
    for (const [path, content] of Object.entries(files)) {
        if (typeof content === "string") {
            newfiles[path] = { content, hash: hashContent(content) }
        }
    }
    project.files = newfiles;
    await project.save()
    const filesObj = {}
    for (const [path, entry] of Object.entries(project.files)) {
        filesObj[path] = entry.content;

    }
    res.status(200).json({
        _id: project._id,
        name: project.name,
        description: project.description,
        files: filesObj,
        message: project.message,
        version: project.version,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt
    })



}

//POST/api/project/:id/publish
//Mark a project as public (auth required)
export async function publishProject(req, res) {
    if (!req.user) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const project = await Project.findOneAndUpdate({ _id: req.params.id, owner: req.user.userId, returnDocument: "after" });
    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }

    res.json({ success: true, published: project.published })

}
//GET/api/project/public/:id
//Mark a publicy publish  project details (without auth)
export async function getPublicProject(req, res) {

    const project = await Project.findById({ _id: req.params.id });
    if (!project) {
        res.status(404).json({ message: "Project not found" });
        return;
    }
    if (!project.publish || project.owner.toString() !== req.user.userId) {
        res.status(403).json({ message: "Access denied" })
        return;
    }
    //serve all files as static
    const filesObj = {}
    for (const [path, entry] of Object.entries(project.files)) {
        filesObj[path] = entry.content;
    }

    res.json({
        _id: project._id,
        name: project.name,
        description: project.description,
        files: filesObj,
        version: project.version


    })

}

