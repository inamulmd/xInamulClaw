import { readProjectFile } from "./read-file.js";

const content = await readProjectFile("package.json");

console.log(content);