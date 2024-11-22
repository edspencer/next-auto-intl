// src/utils/openaiClient.ts
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export const openai = new OpenAI();
