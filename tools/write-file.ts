import { writeFile } from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "../config/project.js";



export async function writeProjectFile(
  filePath: string,
  content: string
): Promise<void> {
  const absolutePath = path.resolve(PROJECT_ROOT, filePath);

  if (
    absolutePath !== PROJECT_ROOT &&
    !absolutePath.startsWith(PROJECT_ROOT + path.sep)
  ) {
    throw new Error("File path must stay inside the project directory.");
  }

  try {
    await writeFile(absolutePath, content, "utf-8");
  } catch {
    throw new Error(`Could not write file: ${filePath}`);
  }
}