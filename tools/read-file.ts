import { readFile } from "node:fs/promises";

export async function readProjectFile(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, "utf-8");

    return content;
  } catch (error) {
    throw new Error(`Could not read file: ${filePath}`);
  }
}