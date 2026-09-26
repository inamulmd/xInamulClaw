import { writeProjectFile } from "./write-file.js";

await writeProjectFile(
  "test-agent-file.txt",
  "Hello from xInamulClaw!"
);

console.log("File written successfully.");