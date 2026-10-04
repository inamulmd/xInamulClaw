import { readdir } from "node:fs/promises";
import path from "node:path";
import { PROJECT_ROOT } from "../config/project.js";


export async function listProjectFiles(
  directory = PROJECT_ROOT
): Promise<string[]> {
  const entries = await readdir(directory, {
    withFileTypes: true,
  });

  const files: string[] = [];

  for (const entry of entries) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === "dist"
    ) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await listProjectFiles(fullPath);
      files.push(...nestedFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}