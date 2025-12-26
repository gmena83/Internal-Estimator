/**
 * Sample Outputs for ISI Business Development Agent
 *
 * This file contains expected outputs for evaluation testing.
 * Each output type has a sample that can be used for comparison.
 */

import {
  getMockEstimateMarkdown,
  getMockScenarioA,
  getMockScenarioB,
  getMockRoiAnalysis,
  getMockPmBreakdown,
  getMockVibecodeGuide,
} from "../fixtures";

// Sample parsed mission data
export const sampleParsedData = {
  mission: "Build an AI-powered customer service automation platform",
  objectives: [
    "Automate customer inquiry routing and response",
    "Implement natural language processing for ticket classification",
    "Create real-time analytics dashboard for support metrics",
    "Integrate with existing CRM and helpdesk systems",
  ],
  constraints: [
    "Budget: $80,000 - $120,000",
    "Timeline: 4-6 months",
    "Must integrate with Salesforce CRM",
    "GDPR and SOC2 compliance required",
  ],
  techPreferences: [
    "Python for backend",
    "React for frontend",
    "AWS for hosting",
    "OpenAI for NLP",
  ],
  timeline: "4-6 months",
  estimatedBudget: "$100,000",
  clientName: "TechCorp Industries",
};

// Sample estimate markdown
export const sampleEstimateMarkdown = `
# Project Estimate: AI Customer Service Platform

## Executive Summary

This estimate presents two strategic approaches for building your AI-powered customer service automation platform. The solution will transform your support operations by automating inquiry routing, implementing intelligent ticket classification, and providing real-time analytics.

### Mission
Build an AI-powered customer service automation platform

### Objectives
- Automate customer inquiry routing and response
- Implement natural language processing for ticket classification
- Create real-time analytics dashboard for support metrics
- Integrate with existing CRM and helpdesk systems

### Constraints
- Budget: $80,000 - $120,000
- Timeline: 4-6 months
- Salesforce CRM integration required
- GDPR and SOC2 compliance

---

## Scenario Comparison

### Scenario A: High-Tech Custom Development

**Full custom AI solution with maximum control and scalability**

| Metric | Value |
|--------|-------|
| Timeline | 16-20 weeks |
| Total Hours | 720 |
| Hourly Rate | $150 |
| **Total Investment** | **$108,000** |

**Tech Stack:**
- Python (FastAPI) backend
- React/TypeScript frontend
- PostgreSQL + Redis
- AWS (ECS, Lambda, S3)
- OpenAI GPT-4 / Claude
- LangChain for AI orchestration

**Features:**
1. Custom NLP Engine (120 hrs)
   - Intent classification model
   - Entity extraction pipeline
   - Multi-language support

2. Intelligent Routing System (80 hrs)
   - Priority scoring algorithm
   - Agent skill matching
   - Queue optimization

3. Analytics Dashboard (100 hrs)
   - Real-time metrics
   - Custom reporting
   - Predictive analytics

4. Salesforce Integration (80 hrs)
   - Bi-directional sync
   - Custom objects mapping
   - Event-driven updates

5. Compliance Module (60 hrs)
   - Data encryption
   - Audit logging
   - GDPR tools

6. Testing & Documentation (80 hrs)
7. Deployment & Training (60 hrs)
8. Project Management (140 hrs)

**Pros:**
- Complete ownership of codebase
- Maximum customization flexibility
- Optimized for your specific workflow
- Full control over AI models
- Scalable architecture

**Cons:**
- Higher initial investment
- Longer development timeline
- Requires ongoing maintenance

---

### Scenario B: No-Code MVP

**Rapid deployment using proven no-code/low-code platforms**

| Metric | Value |
|--------|-------|
| Timeline | 8-10 weeks |
| Total Hours | 320 |
| Hourly Rate | $75 |
| **Total Investment** | **$24,000** |

**Tech Stack:**
- Intercom / Zendesk
- Zapier / Make.com
- Bubble / Retool (dashboards)
- OpenAI API (via integrations)
- Salesforce native connectors

**Features:**
1. Chatbot Configuration (60 hrs)
   - Pre-built AI responses
   - Conversation flows
   - Handoff rules

2. Workflow Automation (50 hrs)
   - Zapier integrations
   - Routing rules
   - Escalation triggers

3. Dashboard Setup (40 hrs)
   - Template customization
   - Metric widgets
   - Export capabilities

4. CRM Integration (40 hrs)
   - Native connectors
   - Field mapping
   - Sync scheduling

5. Testing & Training (50 hrs)
6. Project Management (80 hrs)

**Pros:**
- Significantly lower cost
- Faster time to market
- Lower technical barrier
- Proven platforms

**Cons:**
- Limited customization
- Platform dependencies
- Potential scaling limits
- Ongoing subscription costs

---

## ROI Analysis

| Metric | Value |
|--------|-------|
| Current Support Cost | $180,000/year |
| Projected Savings | $72,000/year |
| Cost of Delay | $6,000/month |

### Scenario A (Custom)
| ROI Metric | Value |
|------------|-------|
| Payback Period | 18 months |
| 3-Year ROI | 100% |
| 5-Year Net Value | $252,000 |

### Scenario B (No-Code)
| ROI Metric | Value |
|------------|-------|
| Payback Period | 4 months |
| 3-Year ROI | 800% |
| 5-Year Net Value | $336,000 |

*Note: No-Code has higher 5-year ROI due to lower initial investment, but may require migration to custom solution as you scale.*

---

## Recommendation

Based on your requirements, we recommend **Scenario A: High-Tech Custom** for:
- Maximum flexibility and control
- Long-term scalability
- Complete data ownership
- Custom AI model tuning

However, if time-to-market is critical, consider starting with **Scenario B** as an MVP, then migrating to a custom solution once you've validated the concept with real users.

---

## Next Steps

1. Review both scenarios
2. Schedule discovery call
3. Select approach
4. Begin Phase 1

---

*Estimate generated by ISI Agent | ${new Date().toLocaleDateString()}*
`;

// Sample email content
export const sampleEmailContent = `Subject: Project Proposal: AI Customer Service Platform

Dear TechCorp Industries Team,

Thank you for the opportunity to present our proposal for your AI-powered customer service automation platform.

After careful analysis of your requirements, we've prepared two strategic approaches:

**Recommended: High-Tech Custom Development**
- Investment: $108,000
- Timeline: 16-20 weeks
- Complete ownership and maximum flexibility

This approach provides:
- Custom NLP engine for precise ticket classification
- Intelligent routing with agent skill matching
- Real-time analytics dashboard
- Native Salesforce integration
- Full GDPR and SOC2 compliance

The projected ROI shows a payback period of 18 months with 100% 3-year return.

I've attached the detailed proposal with feature breakdowns, timeline, and ROI analysis.

Would you be available for a 30-minute call this week to discuss the proposal and answer any questions?

Best regards,
ISI Agent

---
This proposal was generated by ISI, your autonomous Business Development Agent.

Attachments:
- TechCorp_AI_Platform_Proposal.pdf
- Project_Timeline.pdf
`;

// Sample PM breakdown phases
export const samplePmBreakdown = {
  phases: [
    {
      phaseNumber: 1,
      phaseName: "Discovery & Planning",
      objectives: [
        "Align on project scope and success criteria",
        "Document detailed requirements",
        "Design system architecture",
      ],
      deliverables: [
        "Project Charter",
        "Requirements Document",
        "Technical Architecture Diagram",
        "Sprint Plan",
      ],
      durationDays: 10,
      dependencies: [],
      tasks: [
        { id: "1.1", name: "Stakeholder Interviews", estimatedHours: 16 },
        { id: "1.2", name: "Requirements Workshop", estimatedHours: 12 },
        { id: "1.3", name: "Current State Analysis", estimatedHours: 8 },
        { id: "1.4", name: "Architecture Design", estimatedHours: 16 },
        { id: "1.5", name: "Sprint Planning", estimatedHours: 8 },
      ],
    },
    {
      phaseNumber: 2,
      phaseName: "Core Development",
      objectives: [
        "Build core NLP processing engine",
        "Develop API infrastructure",
        "Create database models",
      ],
      deliverables: ["NLP Processing Module", "RESTful API", "Database Schema", "Unit Tests"],
      durationDays: 25,
      dependencies: [1],
      tasks: [
        { id: "2.1", name: "Backend API Development", estimatedHours: 80 },
        { id: "2.2", name: "NLP Model Integration", estimatedHours: 60 },
        { id: "2.3", name: "Database Design & Migration", estimatedHours: 24 },
        { id: "2.4", name: "Authentication & Security", estimatedHours: 32 },
        { id: "2.5", name: "Unit Testing", estimatedHours: 24 },
      ],
    },
    {
      phaseNumber: 3,
      phaseName: "Frontend Development",
      objectives: [
        "Build admin dashboard",
        "Create analytics views",
        "Implement real-time updates",
      ],
      deliverables: ["Admin Dashboard", "Analytics Module", "Real-time Notification System"],
      durationDays: 20,
      dependencies: [2],
      tasks: [
        { id: "3.1", name: "Dashboard UI Development", estimatedHours: 60 },
        { id: "3.2", name: "Charts & Visualization", estimatedHours: 32 },
        { id: "3.3", name: "WebSocket Integration", estimatedHours: 16 },
        { id: "3.4", name: "Responsive Design", estimatedHours: 24 },
        { id: "3.5", name: "Frontend Testing", estimatedHours: 16 },
      ],
    },
    {
      phaseNumber: 4,
      phaseName: "Integration & Testing",
      objectives: ["Integrate with Salesforce CRM", "Perform end-to-end testing", "Security audit"],
      deliverables: ["Salesforce Connector", "E2E Test Suite", "Security Audit Report"],
      durationDays: 15,
      dependencies: [2, 3],
      tasks: [
        { id: "4.1", name: "Salesforce API Integration", estimatedHours: 48 },
        { id: "4.2", name: "Integration Testing", estimatedHours: 32 },
        { id: "4.3", name: "Performance Testing", estimatedHours: 24 },
        { id: "4.4", name: "Security Audit", estimatedHours: 24 },
        { id: "4.5", name: "Bug Fixes", estimatedHours: 32 },
      ],
    },
    {
      phaseNumber: 5,
      phaseName: "Deployment & Training",
      objectives: ["Deploy to production", "Train end users", "Establish support processes"],
      deliverables: ["Production Environment", "Training Materials", "Operations Runbook"],
      durationDays: 10,
      dependencies: [4],
      tasks: [
        { id: "5.1", name: "Production Setup", estimatedHours: 24 },
        { id: "5.2", name: "Data Migration", estimatedHours: 16 },
        { id: "5.3", name: "User Training", estimatedHours: 24 },
        { id: "5.4", name: "Documentation", estimatedHours: 16 },
        { id: "5.5", name: "Go-Live Support", estimatedHours: 20 },
      ],
    },
  ],
};

// Sample Vibecode guides
export const sampleVibecodeGuideA = `
# Execution Manual: High-Tech Custom Development

## Project: AI Customer Service Platform

### Overview
This guide provides step-by-step prompts for AI-assisted development (Vibecode/Cursor/Copilot) to build the custom customer service automation platform.

---

## Tech Stack
- **Backend:** Python 3.11, FastAPI, SQLAlchemy
- **Frontend:** React 18, TypeScript, TailwindCSS
- **Database:** PostgreSQL 15, Redis 7
- **AI/ML:** OpenAI GPT-4, LangChain
- **Cloud:** AWS (ECS, Lambda, RDS, S3)
- **DevOps:** Docker, GitHub Actions, Terraform

---

## Phase 1: Project Setup

### Step 1.1: Initialize Backend
\`\`\`
VIBECODE PROMPT:
Create a FastAPI project structure with:
- app/ directory with routers, services, models, schemas
- Database connection using SQLAlchemy async
- Pydantic settings management
- Docker and docker-compose setup
- pytest configuration with async support
Include health check endpoint and basic error handling.
\`\`\`

### Step 1.2: Initialize Frontend
\`\`\`
VIBECODE PROMPT:
Create a React TypeScript project using Vite with:
- TailwindCSS and shadcn/ui component library
- React Query for API state management
- React Router for navigation
- Zustand for global state
- ESLint and Prettier configuration
Set up a basic layout with sidebar navigation.
\`\`\`

---

## Phase 2: Core Backend Development

### Step 2.1: Database Models
\`\`\`
VIBECODE PROMPT:
Create SQLAlchemy models for a customer service system:
- Ticket (id, title, description, status, priority, created_at, updated_at)
- Customer (id, name, email, company, metadata)
- Agent (id, name, email, skills, availability)
- Conversation (id, ticket_id, messages as JSONB, sentiment_score)
- Assignment (id, ticket_id, agent_id, assigned_at, reason)
Include proper indexes, relationships, and timestamp mixins.
\`\`\`

### Step 2.2: NLP Service
\`\`\`
VIBECODE PROMPT:
Create an AI service module that:
- Uses OpenAI/LangChain for text processing
- Classifies ticket intent into categories (billing, technical, general)
- Extracts key entities (product names, order IDs, dates)
- Calculates urgency score (0-1) based on content
- Returns structured classification result
Include retry logic and fallback handling.
\`\`\`

### Step 2.3: Routing Engine
\`\`\`
VIBECODE PROMPT:
Create an intelligent ticket routing service that:
- Matches ticket category to agent skills
- Considers agent workload and availability
- Implements priority-based queue management
- Supports manual override rules
- Logs routing decisions for analytics
Return routing decision with confidence score and reasoning.
\`\`\`

---

## Phase 3: Frontend Dashboard

### Step 3.1: Dashboard Layout
\`\`\`
VIBECODE PROMPT:
Create an admin dashboard layout with:
- Fixed sidebar with navigation (Tickets, Agents, Analytics, Settings)
- Top header with search and user menu
- Main content area with responsive grid
- Real-time notification bell
Use shadcn/ui components and TailwindCSS.
\`\`\`

### Step 3.2: Analytics Charts
\`\`\`
VIBECODE PROMPT:
Create an analytics dashboard page with:
- Ticket volume chart (line chart, last 30 days)
- Category distribution (pie chart)
- Agent performance table (sortable)
- Average response time trend
- Real-time ticket counter
Use Recharts library with proper loading states.
\`\`\`

---

## Phase 4: Integration

### Step 4.1: Salesforce Connector
\`\`\`
VIBECODE PROMPT:
Create a Salesforce integration service that:
- Authenticates using OAuth 2.0 JWT Bearer flow
- Syncs contacts and accounts bidirectionally
- Creates Cases from tickets
- Updates ticket status when Case status changes
- Implements webhook handler for real-time updates
Include error handling and retry logic.
\`\`\`

---

## Testing Checklist

- [ ] All API endpoints return correct responses
- [ ] NLP classification accuracy > 85%
- [ ] Routing assigns tickets within SLA
- [ ] Dashboard loads in < 2 seconds
- [ ] Salesforce sync runs without errors
- [ ] All compliance requirements met

---

## Deployment Commands

\`\`\`bash
# Build and push Docker images
docker build -t customer-service-api:latest .
docker push ecr.aws/myrepo/customer-service-api:latest

# Run database migrations
alembic upgrade head

# Deploy to AWS ECS
aws ecs update-service --cluster prod --service api --force-new-deployment
\`\`\`

---

*Generated by ISI Agent - Vibecode Execution Manual*
`;

export const sampleVibecodeGuideB = `
# Execution Manual: No-Code MVP Approach

## Project: AI Customer Service Platform

### Overview
This guide provides step-by-step instructions for building the customer service platform using no-code/low-code platforms for rapid deployment.

---

## Tech Stack
- **Helpdesk:** Zendesk / Intercom
- **Automation:** Zapier / Make.com
- **AI:** OpenAI (via Zapier integration)
- **Dashboard:** Retool / Bubble
- **CRM:** Salesforce (native connector)
- **Data:** Airtable / Google Sheets (staging)

---

## Phase 1: Platform Setup

### Step 1.1: Zendesk Configuration
1. Create Zendesk Support account
2. Configure ticket forms:
   - Billing inquiry form
   - Technical support form
   - General inquiry form
3. Set up custom fields:
   - Priority (dropdown)
   - Product (dropdown)
   - Urgency Score (number)
4. Create agent groups by specialty

### Step 1.2: AI Classification Setup (Zapier)
1. Create Zapier account
2. Set up trigger: "New Zendesk Ticket"
3. Add OpenAI action: "Send Prompt"
4. Prompt template:
\`\`\`
Classify this support ticket and respond in JSON:
Subject: {{subject}}
Description: {{description}}

Return: {"category": "billing|technical|general", "urgency": 0.0-1.0, "keywords": []}
\`\`\`
5. Parse JSON response
6. Update Zendesk ticket with classification

---

## Phase 2: Routing Automation

### Step 2.1: Routing Rules (Zendesk)
1. Navigate to Admin > Business Rules > Triggers
2. Create routing triggers:
   - IF category = "billing" THEN assign to Billing Team
   - IF category = "technical" AND urgency > 0.7 THEN assign to Senior Tech
   - IF urgency > 0.9 THEN escalate to manager

### Step 2.2: SLA Policies
1. Create SLA policies:
   - Critical (4 hour response)
   - High (8 hour response)
   - Normal (24 hour response)
2. Link to urgency scores

---

## Phase 3: Analytics Dashboard

### Step 3.1: Retool Dashboard Setup
1. Create Retool account
2. Connect to Zendesk API
3. Create dashboard components:
   - Ticket volume chart (Chart component)
   - Category breakdown (Pie chart)
   - Agent leaderboard (Table)
   - Average response time (Stat)

### Step 3.2: Real-time Updates
1. Set refresh interval to 30 seconds
2. Add WebSocket connection for live tickets
3. Configure notification alerts

---

## Phase 4: Salesforce Integration

### Step 4.1: Native Connector
1. Install Zendesk for Salesforce app
2. Configure field mapping:
   - Zendesk Ticket → Salesforce Case
   - Requester → Contact
   - Organization → Account
3. Enable bi-directional sync

### Step 4.2: Automation Sync (Zapier)
1. Trigger: Salesforce Case Updated
2. Action: Update Zendesk Ticket
3. Map status fields

---

## Testing Checklist

- [ ] Test ticket submission → classification
- [ ] Verify routing rules work correctly
- [ ] Check Salesforce sync (both directions)
- [ ] Validate dashboard data accuracy
- [ ] Test escalation triggers
- [ ] Confirm SLA tracking

---

## Monthly Costs Estimate

| Service | Plan | Monthly Cost |
|---------|------|--------------|
| Zendesk | Professional | $89/agent |
| Zapier | Professional | $73.50 |
| Retool | Team | $10/user |
| OpenAI API | Usage | ~$50 |
| **Total (5 agents)** | | **$578.50** |

---

*Generated by ISI Agent - No-Code Execution Manual*
`;

// Export all samples for testing
export const allSampleOutputs = {
  parsedData: sampleParsedData,
  estimateMarkdown: sampleEstimateMarkdown,
  emailContent: sampleEmailContent,
  pmBreakdown: samplePmBreakdown,
  vibecodeGuideA: sampleVibecodeGuideA,
  vibecodeGuideB: sampleVibecodeGuideB,
  scenarioA: getMockScenarioA(),
  scenarioB: getMockScenarioB(),
  roiAnalysis: getMockRoiAnalysis(),
};

// Validation functions
export function validateEstimate(estimate: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!estimate.estimateMarkdown) {
    errors.push("Missing estimate markdown");
  }
  if (!estimate.scenarioA) {
    errors.push("Missing Scenario A");
  }
  if (!estimate.scenarioB) {
    errors.push("Missing Scenario B");
  }
  if (!estimate.roiAnalysis) {
    errors.push("Missing ROI analysis");
  }
  if (estimate.scenarioA && !estimate.scenarioA.totalCost) {
    errors.push("Scenario A missing total cost");
  }
  if (estimate.scenarioB && !estimate.scenarioB.totalCost) {
    errors.push("Scenario B missing total cost");
  }

  return { valid: errors.length === 0, errors };
}

export function validatePmBreakdown(breakdown: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!breakdown.phases || !Array.isArray(breakdown.phases)) {
    errors.push("Missing or invalid phases array");
    return { valid: false, errors };
  }

  breakdown.phases.forEach((phase: any, index: number) => {
    if (!phase.phaseName) {
      errors.push(`Phase ${index + 1} missing name`);
    }
    if (!phase.tasks || phase.tasks.length === 0) {
      errors.push(`Phase ${index + 1} missing tasks`);
    }
    if (!phase.deliverables || phase.deliverables.length === 0) {
      errors.push(`Phase ${index + 1} missing deliverables`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export function validateEmail(email: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!email.includes("Subject:")) {
    errors.push("Missing subject line");
  }
  if (!email.includes("Dear")) {
    errors.push("Missing greeting");
  }
  if (!email.includes("$") && !email.includes("Investment")) {
    errors.push("Missing pricing information");
  }

  return { valid: errors.length === 0, errors };
}
