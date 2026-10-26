# xInamulClaw

### Turn instructions into working code with your own AI coding agent.

xInamulClaw is a local AI coding assistant that helps you create
new projects, understand existing codebases, and perform coding tasks
using natural-language instructions.

Instead of manually performing every step, describe your goal.
xInamulClaw uses an AI Agent to work with project files and a Planner
to break larger tasks into ordered steps. You can review the plan,
approve proposed changes, and follow execution through either the CLI
or Telegram.

## What can you do with it?

- **Create new projects:** Build a project in a separate workspace
  without keeping its files inside the xInamulClaw repository.
- **Understand existing code:** Read files, inspect project structure,
  and summarize configuration or code.
- **Automate multi-step tasks:** Turn a goal into a plan with
  dependencies and step-by-step execution.
- **Review changes before applying them:** File changes are staged
  for approval. Shell commands also require approval before execution.
- **Control your workflow through Telegram:** Submit goals, approve
  plans, and approve or reject proposed actions from your Telegram chat.
- **See execution results:** Follow step statuses and errors in the
  terminal and Telegram.

## How it works

1. **Describe your goal** in the CLI or send a `/plan` command in Telegram.
2. **Review the generated plan** and approve it before execution starts.
3. **Let the Agent work** through the plan, using the available file
   and shell tools.
4. **Approve or reject proposed actions** when prompted.
5. **Review the result** and see which steps completed or failed.

## Example

Create a new project outside the xInamulClaw repository by sending
a goal with a workspace path:


/plan Create a TypeScript calculator project
workspace: E:\Projects\Calculator

## Requirements

- Node.js **22.14 or later** (the project has been exercised with Node 22.14.0).
- Git.
- An [OpenRouter API key](https://openrouter.ai/).
- A Telegram bot token from [@BotFather](https://t.me/BotFather) if you want to use Telegram.

## Installation

Clone the repository and install dependencies:

```powershell
git clone https://github.com/inamulmd/xInamulClaw.git
cd xInamulClaw
npm install
```

If the repository is private, you need access to it before cloning.

## Configuration

Create a file named `.env` in the repository root. Do not commit this file or share its contents.

```dotenv
OPENROUTER_API_KEY=your_openrouter_api_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_ALLOWED_USER_ID=your_numeric_telegram_user_id
```

- `OPENROUTER_API_KEY` is required when the application starts.
- `TELEGRAM_BOT_TOKEN` is required to start Telegram mode.
- `TELEGRAM_ALLOWED_USER_ID` should be the numeric Telegram user ID allowed to control the bot. Set it before using `/plan`.

The repository's `.gitignore` excludes `.env` and `.env.local`. Keep your keys private even if the repository is public.

### Create a Telegram bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram and use `/newbot`.
2. Copy the token into `TELEGRAM_BOT_TOKEN` in `.env`.
3. Start the app as shown below and choose **Telegram**.
4. Message your bot with `/id` to get your numeric user ID.
5. Set `TELEGRAM_ALLOWED_USER_ID` to that number in `.env`, then restart the app.

Do not publish your bot token or remove the owner restriction to make the bot publicly accessible. The bot can request local file changes and shell commands on the computer where it runs.

## Run the application

From the repository root:

```powershell
npx tsx index.ts wakeup
```

Choose **CLI**, **Telegram**, or **Exit** from the startup menu.

### CLI

Choose **CLI**, then select `chat`, `agent`, or `planner`.

- **chat** provides the chat interface.
- **agent** runs a coding task through the Agent tools.
- **planner** generates a plan, shows its steps, asks for plan approval, and then runs ready steps in dependency order. Staged changes prompt for individual approval.

### Telegram

Choose **Telegram**, then open your bot chat.

Available commands:

- `/start` — show the welcome message.
- `/help` — show available commands.
- `/ping` — check that the bot is online.
- `/id` — show your numeric Telegram user ID.
- `/plan <goal>` — generate and run a plan after approval.

Example:

```text
/plan Read package.json and summarize its scripts. Do not modify or create any files.
```

The bot first displays the proposed plan. Approving the plan starts execution; individual staged actions are shown with **Approve actions** and **Reject actions** buttons. Keep the terminal running while using the bot. The Agent and shell commands run on the machine hosting the Node.js process, not inside Telegram.

## Use a separate project workspace

A plan can target a different directory from the xInamulClaw repository. Put the workspace path on its own line in the `/plan` message, using an **absolute path on the machine running the bot**.

Example for Windows:

```text
/plan Create a small TypeScript project with a README and a basic entry point.
workspace: E:\Projects\MyNewProject
```

When you approve the plan, the application prepares the selected workspace and passes it to the Agent's file tools and shell executor. If you omit `workspace:`, the default is the current working directory used when the app is started.

Choose an empty destination folder for a new project. Review every proposed action carefully. Workspace path checks help prevent file tools from escaping the selected workspace, but they do **not** constitute a security sandbox for arbitrary shell commands.

## Development checks

Run TypeScript checking:

```powershell
npx tsc --noEmit
```

Run the Planner's local success/failure regression test:

```powershell
npx tsx modes/planner/test-execution.ts
```

The package's current `npm test` script is still the default placeholder and is not a configured test suite.

## Known limitations

- This is an early MVP. Expect rough edges and verify results rather than assuming every generated step completed correctly.
- Planner steps are generated by an LLM; simple requests may produce too many steps or repeat work.
- OpenRouter's `openrouter/free` model pool can be rate-limited or return output that the plan generator cannot parse.
- Natural-language restrictions such as “do not modify files” are not a complete security policy. Keep reviewing requested actions and avoid giving the Agent access to sensitive directories.
- Shell commands execute on the local host with the permissions of the user running xInamulClaw. Approval is not the same as sandboxing.
- Telegram is intended for a trusted, configured owner in this version. Do not expose this bot as a shared multi-user coding service without adding user/workspace isolation, stronger policy enforcement, and operational safeguards.
- Long-running tasks and Telegram approval flows may still need more hardening before production use.

## Security notes

- Never commit `.env`, API keys, bot tokens, access tokens, or private project files.
- Use a dedicated workspace for generated projects.
- Reject shell commands or file operations that you do not understand.
- Do not run this as an administrator/root account.
- Back up important projects and use Git before letting an Agent modify them.

## License

No license has been specified in this repository yet. Unless a license is added, assume that normal copyright restrictions apply and check with the repository owner before redistributing the code.
