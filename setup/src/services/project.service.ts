import prisma from "../config/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { RedisService } from "./redis.service.js";

export class ProjectService {
  static async createProject(ownerId: string, data: any) {
    const { name, description } = data;
    if (!name || name.trim() === "") {
      throw new ApiError(400, "Project name is required");
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId,
        members: {
          create: {
            userId: ownerId,
            role: "OWNER",
          },
        },
      },
    });

    await RedisService.del(`dashboard:${ownerId}`);

    return project;
  }

  static async getProjects(userId: string) {
    const cacheKey = `dashboard:${userId}`;
    const cachedProjects = await RedisService.get(cacheKey);
    if (cachedProjects) return cachedProjects;

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    await RedisService.set(cacheKey, projects, 300);
    return projects;
  }

  static async getProject(projectId: string, userId: string) {
    const cacheKey = `project:${projectId}:details`;
    const cachedProject = await RedisService.get(cacheKey);

    let project;
    if (cachedProject) {
      project = cachedProject;
    }

    if (!project) {
      project = await prisma.project.findFirst({
        where: { id: projectId },
        include: {
          owner: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
          members: { select: { userId: true, role: true } },
        },
      });
      if (project) {
        await RedisService.set(cacheKey, project, 300);
      }
    }

    if (!project) throw new ApiError(404, "Project not found");

    const isOwner = project.ownerId === userId;
    const isMember = project.members.some((m: any) => m.userId === userId);
    if (!isOwner && !isMember) throw new ApiError(403, "You don't have access");

    return project;
  }

  static async updateProject(projectId: string, ownerId: string, data: any) {
    const { name, description } = data;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new ApiError(404, "Project not found");
    if (project.ownerId !== ownerId) throw new ApiError(403, "Only the project owner can update it");

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { name, description },
    });

    await RedisService.del(`project:${projectId}:details`);
    await RedisService.del(`dashboard:${ownerId}`);

    return updatedProject;
  }

  static async deleteProject(projectId: string, ownerId: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new ApiError(404, "Project not found");
    if (project.ownerId !== ownerId) throw new ApiError(403, "Only the project owner can delete it");

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { attachments: true },
    });

    for (const task of tasks) {
      for (const attachment of task.attachments) {
        if (attachment.publicId) {
          await deleteFromCloudinary(attachment.publicId);
        }
      }
    }

    await prisma.project.delete({ where: { id: projectId } });
    
    await RedisService.del(`project:${projectId}:details`);
    await RedisService.del(`project:${projectId}:tasks`);
    await RedisService.invalidatePattern(`dashboard:*`);
    return true;
  }

  static async addMember(projectId: string, ownerId: string, userIdToAdd: string, role: "OWNER" | "MEMBER" = "MEMBER") {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new ApiError(404, "Project not found");
    if (project.ownerId !== ownerId) throw new ApiError(403, "Only the project owner can add members");

    const userToAdd = await prisma.user.findUnique({ where: { id: userIdToAdd } });
    if (!userToAdd) throw new ApiError(404, "User to add not found");

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: userIdToAdd },
      },
    });

    if (existingMember) {
      throw new ApiError(400, "User is already a member of this project");
    }

    const member = await prisma.projectMember.create({
      data: {
        projectId,
        userId: userIdToAdd,
        role,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } }
      }
    });

    await RedisService.del(`project:${projectId}:details`);
    await RedisService.del(`dashboard:${userIdToAdd}`);

    return member;
  }

  static async removeMember(projectId: string, ownerId: string, userIdToRemove: string) {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new ApiError(404, "Project not found");
    if (project.ownerId !== ownerId) throw new ApiError(403, "Only the project owner can remove members");

    if (ownerId === userIdToRemove) {
      throw new ApiError(400, "Owner cannot remove themselves. Delete the project instead.");
    }

    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: userIdToRemove },
      },
    });

    if (!existingMember) {
      throw new ApiError(404, "Member not found in this project");
    }

    await prisma.projectMember.delete({
      where: { id: existingMember.id },
    });

    await RedisService.del(`project:${projectId}:details`);
    await RedisService.del(`dashboard:${userIdToRemove}`);

    return true;
  }

  static async listMembers(projectId: string, userId: string) {
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
      throw new ApiError(404, "Project not found or you don't have access");
    }

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: "asc" }
    });

    return members;
  }
}
