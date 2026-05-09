go ahead and read from the docs and the codebase and other files first about the evaulation system of diffrent llm and provoders and setup.
i want u to familiraize first with the state we are in, then i want u to resreach on how we can implmenet/do eval testing for our base prompts, models, and harnness that we are having here.

then i want u to tell me if its worth it to create a custom inhouse (maybe another webapp in our monorepoe that is the eval system) or try to find and outsoruce this with other products that are already on the market

go ahead and start the research

---

mapped current AI state (no eval infra yet, ~1 system prompt + 5 tools + 2 model tiers via OpenRouter); compared eval tooling landscape (Promptfoo, Langfuse, Braintrust, Helicone, OpenAI Evals, DeepEval, Vercel agent-eval); recommended hybrid: Promptfoo as runner + custom shopping-domain scorers as the original contribution, instead of building the full custom webapp originally planned.
