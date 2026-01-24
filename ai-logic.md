# AI Logic & Workflows

**ISI (Intelligent Strategy Interface)** leverages a multi-model AI architecture to transform client inputs into comprehensive project plans. This document outlines the core AI logic, model selection, and prompting strategies used within the system.

## 🧠 AI Architecture

The system uses a "Best Tool for the Job" approach, orchestrating different models based on the complexity and nature of the task.

| Provider          | Model              | Primary Use Case                                                                                                                                                                  |
| :---------------- | :----------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Google Gemini** | `gemini-2.5-flash` | **Reasoning & Analysis**: Mission extraction, estimation logic, ROI calculations, and project breakdown. Selected for its large context window and strong reasoning capabilities. |
| **OpenAI**        | `gpt-5` / `gpt-4o` | **Generative Content**: Email composition, "Vibecoding" guide generation, and general chat. Selected for its high-quality prose and instruction following.                        |
| **Anthropic**     | N/A                | _Integrated but currently disabled/fallback._                                                                                                                                     |
| **Perplexity**    | `sonar-reasoning`  | **Market Research**: Real-time web search and competitive analysis.                                                                                                               |

## 🔄 5-Stage Autonomous Workflow

### 1. Mission Extraction (`processRawInput`)

**Goal**: Convert unstructured text (email, notes) into structured project metadata.

- **Input**: Raw text from user.
- **Model**: Gemini.
- **Logic**:
  1.  Analyzes input to identify "Mission" (High-level goal), "Objectives" (Actionable goals), and "Constraints".
  2.  Extracts entities like Client Name, Budget, and Timeline.
  3.  **Fallback**: If AI fails, uses regex-based extraction to ensure the system never blocks.

### 2. Dual-Scenario Estimation (`generateEstimate`)

**Goal**: Create two contrasting implementation strategies (High-Tech vs. No-Code) with realistic pricing.

- **Context Injection**: The system injects a "Pricing Matrix" (loaded from Excel/JSON) containing base rates and regional multipliers.
- **Model**: Gemini.
- **Prompt Engineering**:
  - Forces a structured JSON output containing exactly two scenarios: `Scenario A` (High-Code) and `Scenario B` (No-Code MVP).
  - Requires calculation of ROI, "Cost of Doing Nothing", and Payback Period.
  - Applies Logic Multipliers: Complexity (5-10x for AI), Data (2-3x), Integration (1.2-1.5x).
- **Regional Logic**: Calculates costs for US-based vs. logic-driven regional alternatives (LATAM 0.45x, Eastern Europe 0.40x).

### 3. Market Research (`conductMarketResearch`)

**Goal**: Validate the project feasibility and analyze competitors.

- **Provider**: Perplexity.
- **Logic**:
  - Performs a search based on the Project Mission.
  - Returns a markdown summary of Competitors, Market Trends, and Potential Risks.
  - This content is appended to the Estimate for context.

### 4. Vibecode Guides (`generateVibeGuides`)

**Goal**: Generate technical execution manuals for developers or AI coding agents.

- **Model**: OpenAI.
- **Logic**:
  - Takes the approved Tech Stack and Feature List.
  - Generates a "High-Code Manual" and a "No-Code Manual".
  - Includes specific prompt chains for other AIs (e.g., "Paste this into ChatGPT to generate the database schema").

### 5. Communication & PM (`generateEmail`, `generatePMBreakdown`)

- **Email**: Generates a professional proposal email summarizing the selected scenario and ROI.
- **PM Breakdown**: Gemini creates a phase-by-phased Gantt-style breakdown with specific task checklists.

## 🛡️ Reliability & Fallbacks

- **Health Tracking**: Every API call is timed and logged. If a service fails (throws Error), it is marked as `degraded` or `offline` in the `storage`.
- **Fallbacks**:
  - If Gemini fails during estimation, a hardcoded "Default Estimate" is generated so the user can still proceed and edit manually.
  - If JSON parsing fails (common LLM issue), the system attempts to sanitize the output or reverts to defaults.
