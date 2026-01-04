export interface DiagnosticFix {
  issue: string;
  cause: string;
  fix: string;
  context?: any;
}

export class DiagnosticErrorService {
  /**
   * Generates a diagnostic fix based on the error.
   */
  static analyze(
    error: any,
    context: { service: string; operation: string; model: string },
  ): DiagnosticFix {
    const errorString = String(error.message || error);

    if (errorString.includes("401") || errorString.includes("invalid_api_key")) {
      return {
        issue: `Authentication failed for ${context.service}`,
        cause: "The API key provided is invalid or expired.",
        fix: `Update the ${context.service.toUpperCase()}_API_KEY in your environment variables.`,
      };
    }

    if (errorString.includes("429") || errorString.includes("rate_limit")) {
      return {
        issue: `${context.service} rate limited`,
        cause: "Too many requests in a short period.",
        fix: "Wait a few minutes or upgrade your API tier. The agent will retry after a delay.",
      };
    }

    if (errorString.includes("maximum context length")) {
      return {
        issue: "Token limit exceeded",
        cause: "The prompt sent to the AI is too large for the current model.",
        fix: "Try reducing the size of the raw input or attachments.",
      };
    }

    return {
      issue: `Unexpected failure in ${context.operation}`,
      cause: errorString,
      fix: "Check the server logs for a full stack trace. The provider might be temporarily down.",
      context,
    };
  }

  /**
   * Formats the fix as a system message.
   */
  static formatAsSystemMessage(fix: DiagnosticFix): string {
    return `[SYSTEM DIAGNOSTIC]
ISSUE: ${fix.issue}
CAUSE: ${fix.cause}
SUGGESTED FIX: ${fix.fix}
${fix.context ? `CONTEXT: ${JSON.stringify(fix.context)}` : ""}`;
  }
}
