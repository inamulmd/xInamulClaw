import { Command } from "commander";
import { select } from "@clack/prompts";
import { startCLI } from "./modes/cli.js";

const program = new Command();

program
  .name("xInamulclaw")
  .description("xInamul CLI")
  .version("1.0.0");

program
  .command("wakeup")
  .description("Wake up xInamulClaw")
  .action(async () => {
    console.log("\n🚀 xInamulClaw is waking up...\n");

    const mode = await select({
      message: "Which mode do you want to use?",
      options: [
        {
          value: "cli",
          label: "CLI",
        },
        {
          value: "telegram",
          label: "Telegram",
        },
        {
          value: "exit",
          label: "Exit",
        },
      ],
    });

    if (mode === "cli") {
      await startCLI();
    }

    if (mode === "telegram") {
      console.log("Telegram mode coming soon...");
    }

    if (mode === "exit") {
      console.log("Goodbye!");
    }
  });

program.parse();