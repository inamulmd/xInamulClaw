import { streamText, stepCountIs } from "ai";
import { openrouter } from "../../ai/client.js";
import { createAgentTools } from "./agent-tools.js";
import { ActionTracker } from "./action-tracker.js";
import { ToolExecutor } from "./tool-executor.js";
import { defaultAgentConfig } from "./types.js";

// streamText: Streams the model's response.
// stepCountIs: Limits the number of tool-use steps.
// openrouter: Connects to your configured AI model.
// createAgentTools: Provides the tools the agent can use.
// ActionTracker: Tracks file changes and other actions.
// ToolExecutor: Executes or stages operations.
// defaultAgentConfig: Provides the default workspace and permissions.

