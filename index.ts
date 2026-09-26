import { Command } from "commander";
import { runWakeup } from "./tui/wakeup.js";

const program = new Command();

program
  .name("xInamulClaw")
  .description("xInamulClaw - AI Agent")
  .version("1.0.0");

program
  .command("wakeup")
  .description("Wake up xInamulClaw")
  .action(runWakeup);

program.parse();