import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { RedisService } from "./redis.service.js";

export class TaskService {
  private static async verifyProjectAccess(projectId: string, userId: string) {
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
    });

    if (!project) {
      throw new ApiError(403, "You do not have access to this project");
    }
    return project;
  }

  static async createTask(userId: string, projectId: string, data: any) {
    await this.verifyProjectAccess(projectId, userId);

    const { title, description, status = "TODO", priority = "MEDIUM", assigneeId, dueDate } = data;

    if (!title || title.trim() === "") {
      throw new ApiError(400, "Task title is required");
    }

    const lastTask = await prisma.task.findFirst({
      where: { projectId, status },
      orderBy: { position: "desc" },
    });

    const position = lastTask ? lastTask.position + 1024 : 1024;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        position,
        dueDate: dueDate ? new Date(dueDate) : null,
        projectId,
        assigneeId,
        createdById: userId,
      },
    });

    await RedisService.del(`project:${projectId}:tasks`);

    return task;
  }

  static async getTasksOfProject(userId: string, projectId: string) {
    await this.verifyProjectAccess(projectId, userId);

    const cacheKey = `project:${projectId}:tasks`;
    const cachedTasks = await RedisService.get(cacheKey);
    if (cachedTasks) return cachedTasks;

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { id: true, fullName: true, avatarUrl: true } },
        attachments: true,
      },
      orderBy: { position: "asc" },
    });

    await RedisService.set(cacheKey, tasks, 300);

    return tasks;
  }

  static async getTask(userId: string, taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: { select: { id: true, ownerId: true } },
        attachments: true,
        assignee: { select: { id: true, fullName: true, avatarUrl: true } }
      }
    });

    if (!task) throw new ApiError(404, "Task not found");
    await this.verifyProjectAccess(task.projectId, userId);

    return task;
  }

  static async updateTask(userId: string, taskId: string, data: any) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new ApiError(404, "Task not found");
    await this.verifyProjectAccess(task.projectId, userId);

    const { title, description, status, priority, position, assigneeId, dueDate } = data;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: title !== undefined ? title : task.title,
        description: description !== undefined ? description : task.description,
        status: status !== undefined ? status : task.status,
        priority: priority !== undefined ? priority : task.priority,
        position: position !== undefined ? position : task.position,
        assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : task.dueDate,
      },
    });

    await RedisService.del(`project:${task.projectId}:tasks`);

    return updatedTask;
  }

  static async deleteTask(userId: string, taskId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { attachments: true }
    });
    
    if (!task) throw new ApiError(404, "Task not found");
    await this.verifyProjectAccess(task.projectId, userId);

    const { deleteFromCloudinary } = await import("../utils/cloudinary.js");
    
    for (const attachment of task.attachments) {
      if (attachment.publicId) {
        await deleteFromCloudinary(attachment.publicId);
      }
    }

    await prisma.task.delete({ where: { id: taskId } });
    await RedisService.del(`project:${task.projectId}:tasks`);
    return true;
  }
}
