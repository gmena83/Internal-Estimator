import { beforeAll, afterAll, afterEach, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock environment variables for tests
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.SESSION_SECRET = "test-session-secret";
process.env.NODE_ENV = "test";

// Mock AI API keys
process.env.AI_INTEGRATIONS_GEMINI_API_KEY = "test-gemini-key";
process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY = "test-anthropic-key";
process.env.AI_INTEGRATIONS_OPENAI_API_KEY = "test-openai-key";
process.env.PERPLEXITY_API_KEY = "test-perplexity-key";
process.env.RESEND_API_KEY = "test-resend-key";

// Global test cleanup
afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});

// Suppress console logs during tests (optional)
beforeAll(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
