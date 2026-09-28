import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function runProjectCommand(
  command: string
): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024,
    });

    return stdout || stderr;
  } catch (error: any) {
    return error.stdout || error.stderr || error.message;
  }
}