import { confirm, intro, isCancel, outro, text } from "@clack/prompts";
import type { ModelMessage, ToolModelMessage,JSONValue } from "ai";
import { askAI, type Message } from "../ai/chat.js";
import { runAgent,continueAgent  } from "./agent/agent.js";

import { Planner } from "./planner/planner.js";






function createToolResultMessage(
    toolCallId: string,
    toolName: string,
    output: string | JSONValue,
    outputType: "text" | "json",
  ): ToolModelMessage {
    return {
      role: "tool",
      content: [
        {
          type: "tool-result",
          toolCallId,
          toolName,
          output:
            outputType === "text"
              ? {
                  type: "text",
                  value: String(output),
                }
              : {
                  type: "json",
                  value: output,
                },
        },
      ],
    };
}



export async function startCLI() {
  intro("xInamulClaw CLI");

    const mode = await text({
    message: "Choose your mode (chat/agent/planner)",
    placeholder: "plnner",
  });



  if (mode === "planner") {
    const goal = await text({
      message: "What goal should the Planner complete?",
      placeholder: "Create a TypeScript calculator project",
    });

    if (isCancel(goal) || typeof goal !== "string" || !goal.trim()) {
      outro("Planner cancelled.");
      return;
    }

    const planner = new Planner();

    try {
      const plan = await planner.createPlan(goal.trim());

      console.log("\nGenerated plan:");
      console.log(`Goal: ${plan.goal}`);

      for (const step of plan.steps) {
        console.log(`\n${step.id}: ${step.description}`);
        console.log(
          `Dependencies: ${step.dependencies.join(", ") || "None"}`,
        );
      }

      const approved = await confirm({
        message: "Approve this plan and begin execution?",
      });

      if (isCancel(approved) || !approved) {
        outro("Plan cancelled. No steps executed.");
        return;
      }

      const completedPlan = await planner.runPlan(plan.id);

      console.log("\nPlanner execution results:");

      for (const step of completedPlan.steps) {
        console.log(`${step.id}: ${step.status}`);

        if (step.error) {
          console.log(`Error: ${step.error}`);
        }
      }

      outro(`Planner finished with status: ${completedPlan.status}`);
    } catch (error) {
      console.error(
        "Planner failed:",
        error instanceof Error ? error.message : String(error),
      );
    }

    return;
  }

  
  if (mode === "agent") {
    const prompt = await text({
      message: "What should the agent do?",
      placeholder: "Describe your task...",
    });

    if (typeof prompt === "string") {
      const { result, tracker, executor, messages } = await runAgent(prompt);/********/
    

      for await (const chunk of result.textStream) {
        process.stdout.write(chunk);
      }


      console.log("\n");

      const pendingActions = tracker.getPendingMutations();

      if (pendingActions.length > 0) {
        console.log("\nPending actions:");

        console.log("\nPending actions:");

          for (const action of pendingActions) {
            console.log(`- Type: ${action.type}`);
            console.log(`  Path: ${action.path}`);

            if (action.details.command) {
              console.log(`  Command: ${action.details.command}`);
            }
          }

        const approved = await confirm({
          message: "Do you approve these changes?",
        });

        if (isCancel(approved) || !approved) {
          for (const action of pendingActions) {
            tracker.updateStatus(action.id, "rejected", false);
          }

          console.log("Changes rejected.");
        } else {
          for (const action of pendingActions) {
            tracker.updateStatus(action.id, "approved", true);
          }


          const responseMessages = await result.responseMessages;

           


            for (const message of responseMessages) {
              if (message.role === "assistant") {
                messages.push(message);
              }
            }
           
          

          for (const action of tracker.getActions()) {

             if (action.type === "tool_execute" && action.status !== "approved") {
             continue;
             }
            if (action.type === "tool_execute") {
              try {
               const shellResult = executor.executeApprovedShell(action.id);

            

                const toolResultMessage: ToolModelMessage = {
                    role: "tool",
                    content: [
                      {
                        type: "tool-result",
                        toolCallId: shellResult.toolCallId,
                        toolName: "execute_shell",
                        output: {
                          type: "json",
                          value: {
                            command: shellResult.command,
                            stdout: shellResult.stdout,
                            stderr: shellResult.stderr,
                            exitCode: shellResult.exitCode,
                            ...(shellResult.error && {
                              error: shellResult.error,
                            }),
                            toolCallId: shellResult.toolCallId,
                          },
                        },
                      },
                    ],
                  };

                  messages.push(toolResultMessage);


                  console.log("\nShell result:");
                  console.log("Command:", shellResult.command);
                  console.log("Exit code:", shellResult.exitCode);
                  console.log("Output:", shellResult.stdout);
                  console.log("Error:", shellResult.stderr);

                if (shellResult.error) {
                  console.error("Execution error:", shellResult.error);
                }
              } catch (error) {
                console.error("Shell execution failed:", error);
              }
            }

            else if (action.type === "file_create") {
              const toolResultMessage: ToolModelMessage = {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolCallId: action.details.toolCallId!,
                    toolName: "create_file",
                    output: {
                      type: "json",
                      value: {
                        success: true,
                        path: action.path,
                        message: `File created successfully: ${action.path}`,
                      },
                    },
                  },
                ],
              };

              messages.push(toolResultMessage);
            }

            else if (action.type === "file_modify") {
              const toolResultMessage: ToolModelMessage = {
              role: "tool",
              content: [
                {
                  type: "tool-result",
                  toolCallId: action.details.toolCallId!,
                  toolName: "modify_file",
                  output: {
                    type: "json",
                    value: {
                      success: true,
                      path: action.path,
                      message: `File modified successfully: ${action.path}`,
                    },
                  },
                },
              ],
            };

              console.log("MODIFY TOOL CALL ID:", action.details.toolCallId);

              messages.push(toolResultMessage);
            }

            else if (action.type === "code_analysis" && (action.details.toolName === "read_file" || action.details.toolName === "list_files")) {
                const toolResultMessage: ToolModelMessage = {
                  role: "tool",
                  content: [
                    {
                      type: "tool-result",
                      toolCallId: action.details.toolCallId!,
                      toolName: action.details.toolName!,
                      output: {
                        type: "text",
                        value: action.details.after ?? "",
                      },
                    },
                  ],
                };

                messages.push(toolResultMessage);
              }

              else if (action.type === "file_delete") {
                const toolResultMessage: ToolModelMessage = {
                  role: "tool",
                  content: [
                    {
                      type: "tool-result",
                      toolCallId: action.details.toolCallId!,
                      toolName: "delete_file",
                      output: {
                        type: "json",
                        value: {
                          success: true,
                          path: action.path,
                          message: `File deleted successfully: ${action.path}`,
                        },
                      },
                    },
                  ],
                };

                messages.push(toolResultMessage);
              }


              else if (action.type === "folder_create") {
              const toolResultMessage: ToolModelMessage = {
                role: "tool",
                content: [
                  {
                    type: "tool-result",
                    toolCallId: action.details.toolCallId!,
                    toolName: "create_folder",
                    output: {
                      type: "json",
                      value: {
                        success: true,
                        path: action.path,
                        message: `Folder created successfully: ${action.path}`,
                      },
                    },
                  },
                ],
              };

              messages.push(toolResultMessage);
            }
          }


          const { errors } = executor.applyApprovedFromTracker();

          if (errors.length > 0) {
            console.error("Some actions failed:", errors);
          } else {
            console.log("Approved actions applied successfully.");
          }
         const continuation = await continueAgent(messages, executor);

          console.log("\nCONTINUATION STARTED");

          for await (const chunk of continuation.textStream) {
            process.stdout.write(chunk);
          }

          console.log("\n");

          const continuationMessages = await continuation.responseMessages;

          for (const message of continuationMessages) {
            if (message.role === "assistant") {
              messages.push(message);
            }
          }

          const newPendingActions = tracker.getPendingMutations();

            if (newPendingActions.length > 0) {
              console.log("\nNew pending actions:");

              for (const action of newPendingActions) {
                console.log(`- Type: ${action.type}`);
                console.log(`  Path: ${action.path}`);

                if (action.details.command) {
                  console.log(`  Command: ${action.details.command}`);
                }
              }

              const approveNewActions = await confirm({
                message: "Do you approve these new changes?",
              });

              if (isCancel(approveNewActions) || !approveNewActions) {
                for (const action of newPendingActions) {
                  tracker.updateStatus(action.id, "rejected", false);
                }

                console.log("New changes rejected.");
              } else {
                for (const action of newPendingActions) {
                  tracker.updateStatus(action.id, "approved", true);
                }

                const { errors: newErrors } = executor.applyApprovedFromTracker();

                if (newErrors.length > 0) {
                  console.error("Some new actions failed:", newErrors);
                } else {
                  console.log("New approved actions applied successfully.");
                }
              }
            } else {
              console.log("\nNo new pending actions.");
            }

          
        }
      } else {
        console.log("No pending actions.");
      }
    }

    outro("Agent session finished.");
    return;
  }

  const messages: Message[] = [];

  while (true) {
    const input = await text({
      message: "You:",
      placeholder: "Type your message...",
    });

    if (typeof input !== "string") {
      break;
    }

    if (input.toLowerCase() === "exit") {
      break;
    }

    messages.push({
      role: "user",
      content: input,
    });

    console.log("\nAI:\n");

    try {
      const result = await askAI(messages);

let response = "";

  for await (const chunk of result.textStream) {
    process.stdout.write(chunk);
    response += chunk;
  }

  if (!response) {
    const finalResult = await result.text;
    response = finalResult;
  }

      messages.push({
        role: "assistant",
        content: response,
      });

      console.log("\n");
    } catch (error) {
      console.error("\nSomething went wrong:", error);
    }
  }

  outro("Goodbye from xInamulClaw!");
}