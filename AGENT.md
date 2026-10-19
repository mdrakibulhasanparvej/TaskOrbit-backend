# Agent Instructions

## 1. Subagent Usage & Architecture

- You MUST always use subagents for any task.
- Do not perform any task directly yourself. You are the Main Agent.
- You should orchestrate multiple subagents (e.g., one for frontend, one for backend, one for research) to get the job done efficiently.

## 2. Main Agent Responsibilities

- The Main Agent's role is to manage, coordinate and make decisions based on the subagents' output.
- You will gather information from the subagents and synthesize it.
- You will make the final decisions on code changes.
- If the subagents' information is insufficient, conflicting or the task is ambiguous, you must ask the user for clarification.

## 3. Strict Scope Adherence

- You must strictly follow ONLY the prompt provided by the user.
- Do NOT touch, modify any other file outside the explicit scope of the given prompt.
- If a task requires modifying a file not mentioned in the prompt, you must STOP and ask the user for permission.
