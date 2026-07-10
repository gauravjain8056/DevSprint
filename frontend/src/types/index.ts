export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: User;
  members?: ProjectMember[];
  tasks?: Task[];
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: "OWNER" | "MEMBER";
  joinedAt: string;
  user?: User;
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  dueDate?: string | null;
  projectId: string;
  assigneeId?: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignee?: User;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  publicId: string;
  mimeType: string;
  size: number;
  taskId: string;
  uploadedById: string;
  createdAt: string;
}
