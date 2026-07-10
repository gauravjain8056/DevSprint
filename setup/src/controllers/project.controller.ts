import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ProjectService } from "../services/project.service.js";

const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await ProjectService.createProject(req.user.id, req.body);
  return res.status(201).json(new ApiResponse(201, { project }, "Project created successfully"));
});

const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await ProjectService.getProjects(req.user.id);
  return res.status(200).json(new ApiResponse(200, { projects }, "Projects fetched successfully"));
});

const getProject = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const project = await ProjectService.getProject(projectId, req.user.id);
  return res.status(200).json(new ApiResponse(200, { project }, "Project fetched successfully"));
});

const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const project = await ProjectService.updateProject(projectId, req.user.id, req.body);
  return res.status(200).json(new ApiResponse(200, { project }, "Project updated successfully"));
});

const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  await ProjectService.deleteProject(projectId, req.user.id);
  return res.status(200).json(new ApiResponse(200, {}, "Project deleted successfully"));
});

const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const { userId, role } = req.body;
  if (!userId) throw new ApiError(400, "User ID is required to add member");

  const member = await ProjectService.addMember(projectId, req.user.id, userId, role);
  return res.status(201).json(new ApiResponse(201, { member }, "Member added successfully"));
});

const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const { projectId, userId } = req.params;
  await ProjectService.removeMember(projectId, req.user.id, userId);
  return res.status(200).json(new ApiResponse(200, {}, "Member removed successfully"));
});

const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const members = await ProjectService.listMembers(projectId, req.user.id);
  return res.status(200).json(new ApiResponse(200, { members }, "Members fetched successfully"));
});

export {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  listMembers,
};
