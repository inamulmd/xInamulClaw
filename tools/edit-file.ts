import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "../config/project.js";



export async function editProjectFile(
  filePath: string,
  oldText: string,
  newText: string
): Promise<string> {
  const absolutePath = path.resolve(PROJECT_ROOT, filePath);

  if (
    absolutePath !== PROJECT_ROOT &&
    !absolutePath.startsWith(PROJECT_ROOT + path.sep)
  ) {
    throw new Error("File path must stay inside the project directory.");
  }

  const content = await readFile(absolutePath, "utf-8");

  if (!content.includes(oldText)) {
    throw new Error("The text to replace was not found in the file.");
  }

  const updatedContent = content.replace(oldText, newText);

  await writeFile(absolutePath, updatedContent, "utf-8");

  return `Successfully edited file: ${filePath}`;
}