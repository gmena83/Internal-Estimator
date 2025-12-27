# AI Logic & Prompt Engineering

## Overview

The "Brain" of ISI resides in `server/ai-service.ts`. It orchestrates Google Gemini (Reasoning) and OpenAI (Creative/Fallback) through a 5-Stage Autonomous Workflow.

## Workflow Prompts

### Stage 1: Mission Extraction (`processRawInput`)

- **Model:** `gemini-2.5-flash`
- **Goal:** Convert unstructured client emails/notes into structured project data.
- **Pattern:** JSON Extraction.
- **Key Prompt:**
  > "Extract and return a JSON object with the following structure: { mission, objectives, ... }"

### Stage 2: Dual-Scenario Estimation (`generateEstimate`)

- **Model:** `gemini-2.5-flash`
- **Goal:** Create two distinct project approaches (High-Tech Custom vs. No-Code MVP).
- **Pattern:** Comparative Reasoning.
- **Key Prompt:**
  > "Generate a detailed project estimate with TWO scenarios following 2026 pricing standards... SCENARIO A (High-Tech)... SCENARIO B (No-Code)..."

### Stage 3: Proposal Email (`generateEmail`)

- **Model:** `gpt-5` (or Gemini Fallback)
- **Goal:** Write a persuasive cover email.
- **Pattern:** Role-Playing ("Professional Business Development Specialist").
- **Key Prompt:**
  > "Write a compelling proposal email that is warm but professional... creating urgency..."

### Stage 4: Vibe Coding Guides (`generateVibeGuides`)

- **Model:** `gpt-5`
- **Goal:** specific technical instructions for AI coding assistants.
- **Pattern:** Technical Specification.
- **Key Prompt:**
  > "Create TWO detailed execution manuals... Manual A (High-Code)... Manual B (No-Code)..."

### Stage 5: PM Breakdown (`generatePMBreakdown`)

- **Model:** `gemini-2.5-flash`
- **Goal:** Task-level project planning.
- **Pattern:** Hierarchical decomposition.
- **Key Prompt:**
  > "Create phases with objectives, tasks, estimated hours, and completion checklists..."

## Image Generation logic (`image-service.ts`)

- **Model:** `gemini-2.0-flash-exp`
- **Technique:** Iterative prompt generation (10 variations) + "Clean composition" constraints.
