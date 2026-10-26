import { ActionTracker } from "./action-tracker.js";
import { ToolExecutor } from "./tool-executor.js";
import { defaultAgentConfig } from "./types.js";

const tracker = new ActionTracker();
const executor = new ToolExecutor(tracker, defaultAgentConfig());

const result = executor.queueShell("notepad", "guard-test");

console.log("Guard result:", result);
console.log("Tracked actions:", tracker.getActions().length);

if (
  !result.includes('"blocked":true') ||
  tracker.getActions().length !== 0
) {
  console.error("FAIL: Interactive app was not blocked correctly.");
  process.exitCode = 1;
} else {
  console.log("PASS: Notepad was blocked; no action was queued.");
}