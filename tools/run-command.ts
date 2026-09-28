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

    if (stderr) {
      return `Command completed with output:\n${stderr}\n${stdout}`;
    }

    return stdout || "Command completed successfully.";
  } catch (error: any) {
    return `Command failed:\n${error.stderr || error.stdout || error.message}`;
  }
}