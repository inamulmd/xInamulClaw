import { listProjectFiles } from "./list-files.js";

const files = await listProjectFiles(".");

for (const file of files) {
  console.log(file);
}