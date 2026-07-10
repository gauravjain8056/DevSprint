import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { TaskService } from "../services/task.service.js";

const createTask = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const task = await TaskService.createTask(req.user.id, projectId, req.body);
  return res.status(201).json(new ApiResponse(201, { task }, "Task created successfully"));
});

const getTasksOfProject = asyncHandler(async (req: Request, res: Response) => {
  const { projectId } = req.params;
  const tasks = await TaskService.getTasksOfProject(req.user.id, projectId);
  return res.status(200).json(new ApiResponse(200, { tasks }, "Tasks fetched successfully"));
});

const getTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const task = await TaskService.getTask(req.user.id, taskId);
  return res.status(200).json(new ApiResponse(200, { task }, "Task fetched successfully"));
});

const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const task = await TaskService.updateTask(req.user.id, taskId, req.body);
  return res.status(200).json(new ApiResponse(200, { task }, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  await TaskService.deleteTask(req.user.id, taskId);
  return res.status(200).json(new ApiResponse(200, {}, "Task deleted successfully"));
});

export { createTask, getTasksOfProject, getTask, updateTask, deleteTask };
