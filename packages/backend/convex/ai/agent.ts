import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { selectModel } from "./models";
import { SYSTEM_PROMPT } from "./prompt";

export const shoppingAdvisor = new Agent(components.agent, {
  name: "Shopping Advisor",
  languageModel: selectModel("conversational"),
  instructions: SYSTEM_PROMPT,
  maxSteps: 3,
});
