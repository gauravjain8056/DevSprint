import Groq from "groq-sdk";
import { ApiError } from "../utils/ApiError.js";
import { TaskService } from "./task.service.js";
import { ProjectService } from "./project.service.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "" });

const MODEL = "llama-3.3-70b-versatile";

const tools: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "createTask",
      description: "Create a new task in the project",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          description: { type: "string", description: "Detailed description" },
          status: {
            type: "string",
            description: "Task status: TODO, IN_PROGRESS, REVIEW, or DONE",
            enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
          },
          priority: {
            type: "string",
            description: "Task priority: LOW, MEDIUM, or HIGH",
            enum: ["LOW", "MEDIUM", "HIGH"],
          },
          assigneeId: { type: "string", description: "UUID of the user to assign" },
          dueDate: { type: "string", description: "ISO 8601 date string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "updateTask",
      description: "Update an existing task",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "UUID of the task to update" },
          title: { type: "string", description: "New title" },
          status: {
            type: "string",
            description: "New status",
            enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"],
          },
          priority: {
            type: "string",
            description: "New priority",
            enum: ["LOW", "MEDIUM", "HIGH"],
          },
          dueDate: { type: "string", description: "New due date (ISO 8601)" },
        },
        required: ["taskId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "deleteTask",
      description: "Delete an existing task permanently",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "UUID of the task to delete" },
        },
        required: ["taskId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "summarizeProject",
      description: "Get a summary of the project's task counts by status",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "UUID of the project to summarize" },
        },
        required: ["projectId"],
      },
    },
  },
];

export class AiService {
  static async executeTool(userId: string, projectId: string, name: string, args: any) {
    switch (name) {
      case "createTask":
        return await TaskService.createTask(userId, projectId, args);
      case "updateTask":
        return await TaskService.updateTask(userId, args.taskId, args);
      case "deleteTask":
        return await TaskService.deleteTask(userId, args.taskId);
      case "summarizeProject": {
        const tasks = await TaskService.getTasksOfProject(userId, projectId);
        return {
          totalTasks: tasks.length,
          todo: tasks.filter((t: any) => t.status === "TODO").length,
          inProgress: tasks.filter((t: any) => t.status === "IN_PROGRESS").length,
          inReview: tasks.filter((t: any) => t.status === "REVIEW").length,
          done: tasks.filter((t: any) => t.status === "DONE").length,
        };
      }
      default:
        throw new Error(`Tool "${name}" is not implemented`);
    }
  }

  static async assist(userId: string, projectId: string, prompt: string) {
    if (!process.env.GROQ_API_KEY) {
      throw new ApiError(500, "Groq API key is missing");
    }

    await ProjectService.getProject(projectId, userId);

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `You are the DevSprint AI Assistant. You help users manage their software projects.
The user is working on project ID: ${projectId}.
Use the available tools to create, update, or delete tasks, or summarize the project.
For general questions, reply conversationally without using tools.`,
      },
      { role: "user", content: prompt },
    ];

    const firstResponse = await groq.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: "auto",
    });

    const actionsTaken: any[] = [];
    const firstMessage = firstResponse.choices[0].message;
    const toolCalls = firstMessage.tool_calls ?? [];

    if (toolCalls.length > 0) {
      messages.push(firstMessage);

      for (const toolCall of toolCalls) {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");

        try {
          const result = await this.executeTool(userId, projectId, name, args);
          actionsTaken.push({ tool: name, args, result });
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(result),
          });
        } catch (error: any) {
          console.error(`Tool ${name} error:`, error.message);
          actionsTaken.push({ tool: name, args, error: error.message });
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ error: error.message }),
          });
        }
      }

      const finalResponse = await groq.chat.completions.create({
        model: MODEL,
        messages,
      });

      return {
        responseText:
          finalResponse.choices[0].message.content ??
          "Done! The action was completed successfully.",
        actionsTaken,
      };
    }

    return {
      responseText:
        firstMessage.content ?? "I couldn't process that request. Please try again.",
      actionsTaken,
    };
  }
}
