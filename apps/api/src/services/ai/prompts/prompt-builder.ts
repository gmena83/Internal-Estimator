import { PROMPTS } from "./templates.js";

export class PromptBuilder {
  /**
   * Builds a prompt by injecting context into a template.
   * @param templateKey The key of the template in PROMPTS
   * @param context An object mapping placeholders to values
   */
  static build(templateKey: keyof typeof PROMPTS, context: Record<string, any>): string {
    let template = PROMPTS[templateKey];

    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{{${key}}}`;
      const stringValue =
        typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
      template = template.replace(
        new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
        stringValue,
      );
    }

    return template;
  }
}
