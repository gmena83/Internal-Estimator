import type { Request, Response, NextFunction } from "express";

/**
 * Normalize URLs in response to always be absolute
 */
export function normalizeUrl(url: string | null | undefined, req: Request): string | null {
  if (!url) return null;

  // Already absolute
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  // Relative URL - make it absolute
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:5000";
  const baseUrl = `${protocol}://${host}`;

  // Ensure URL starts with /
  const normalizedPath = url.startsWith("/") ? url : "/" + url;

  return `${baseUrl}${normalizedPath}`;
}

/**
 * Middleware to validate and normalize API responses
 */
export function responseValidator(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);

  res.json = function (body: any) {
    // Normalize URL fields in response
    if (body && typeof body === "object") {
      const normalized = normalizeResponseUrls(body, req);
      return originalJson(normalized);
    }

    return originalJson(body);
  };

  next();
}

/**
 * Recursively normalize URL fields in response objects
 */
function normalizeResponseUrls(obj: any, req: Request): any {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => normalizeResponseUrls(item, req));
  }

  const normalized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if field name suggests it's a URL
    if (isUrlField(key) && typeof value === "string") {
      normalized[key] = normalizeUrl(value, req);
    } else if (value && typeof value === "object") {
      normalized[key] = normalizeResponseUrls(value, req);
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Check if field name suggests it contains a URL
 */
function isUrlField(fieldName: string): boolean {
  const urlPatterns = ["url", "Url", "URL", "uri", "Uri", "URI", "link", "Link"];
  return urlPatterns.some((pattern) => fieldName.includes(pattern));
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
