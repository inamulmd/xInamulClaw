import { readFile } from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "../config/project.js";

export async function readProjectFile(filePath: string): Promise<string> {
  try {

    const absolutePath = path.resolve(PROJECT_ROOT, filePath);
    const content = await readFile(absolutePath, "utf-8");

    return content;
  } catch (error) {
    throw new Error(`Could not read file: ${filePath}`);
  }
}