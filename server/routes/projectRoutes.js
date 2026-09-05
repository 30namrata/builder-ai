import { Router } from "express";
import { createProject, deleteProject, getProject, getPublicProject, listProject, publishProject, updateProjectFiles } from "../controllers/projectController.js";
import { authMiddleware } from "../middleware/authmiddleware.js";
import { chat } from "../controllers/chatController.js";

const projectRouter = Router();
//Public route
projectRouter.get('/public/:id', getPublicProject);

//protected route
projectRouter.use(authMiddleware);

projectRouter.post('/', createProject);

projectRouter.get('/', listProject);

projectRouter.get('/:id', getProject)

projectRouter.delete('/:id', deleteProject);
projectRouter.put('/:id/files', updateProjectFiles);
projectRouter.post('/:id/publish', publishProject);
projectRouter.post('/:id/chat', chat)

export default projectRouter;

