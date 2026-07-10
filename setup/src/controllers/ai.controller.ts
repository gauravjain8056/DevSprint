import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { AiService } from "../services/ai.service.js";

const assist = asyncHandler(async (req: Request, res: Response) => {
  const { prompt, projectId } = req.body;

  if (!prompt || !projectId) {
    throw new ApiError(400, "Prompt and projectId are required");
  }

  const { responseText, actionsTaken } = await AiService.assist(req.user.id, projectId, prompt);

  return res.status(200).json(
    new ApiResponse(200, { responseText, actionsTaken }, "AI Assistant response")
  );
});

export { assist };
