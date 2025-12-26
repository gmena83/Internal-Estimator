import { DiagnosticFinding, CorrectedSnippet, DiagnosticReport } from "@shared/schema";

interface RepoFile {
  path: string;
  content: string;
  size: number;
}

interface RepoAnalysis {
  files: RepoFile[];
  hasReplitConfig: boolean;
  hasNixConfig: boolean;
  hasPackageJson: boolean;
  hasRequirementsTxt: boolean;
  hasGitignore: boolean;
  primaryLanguage: string;
}

const SECRET_PATTERNS = [
  { pattern: /['"]sk-[a-zA-Z0-9]{32,}['"]/, name: "OpenAI API Key" },
  { pattern: /['"]AIza[a-zA-Z0-9_-]{35}['"]/, name: "Google API Key" },
  { pattern: /['"]ghp_[a-zA-Z0-9]{36}['"]/, name: "GitHub Personal Token" },
  { pattern: /['"]ghs_[a-zA-Z0-9]{36}['"]/, name: "GitHub App Token" },
  { pattern: /['"]xoxb-[a-zA-Z0-9-]+['"]/, name: "Slack Bot Token" },
  { pattern: /['"]xoxp-[a-zA-Z0-9-]+['"]/, name: "Slack User Token" },
  { pattern: /['"]sk_live_[a-zA-Z0-9]{24,}['"]/, name: "Stripe Live Key" },
  { pattern: /['"]rk_live_[a-zA-Z0-9]{24,}['"]/, name: "Stripe Restricted Key" },
  { pattern: /mongodb(\+srv)?:\/\/[^'"\s]+:[^'"\s]+@/, name: "MongoDB Connection String" },
  { pattern: /postgres(ql)?:\/\/[^'"\s]+:[^'"\s]+@/, name: "PostgreSQL Connection String" },
  { pattern: /mysql:\/\/[^'"\s]+:[^'"\s]+@/, name: "MySQL Connection String" },
  { pattern: /['"]AKIA[A-Z0-9]{16}['"]/, name: "AWS Access Key" },
  { pattern: /['"][a-zA-Z0-9/+=]{40}['"](?=.*secret)/i, name: "AWS Secret Key Pattern" },
  { pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/, name: "Hardcoded Password" },
  { pattern: /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9_-]{20,}['"]/, name: "Generic API Key" },
];

const HARDCODED_PATH_PATTERNS = [
  { pattern: /\/Users\/[a-zA-Z0-9_-]+\//, name: "macOS User Path" },
  { pattern: /C:\\Users\\[a-zA-Z0-9_-]+\\/, name: "Windows User Path" },
  { pattern: /\/home\/[a-zA-Z0-9_-]+\/(?!repl)/, name: "Linux Home Path" },
];

const DANGEROUS_PATTERNS = [
  { pattern: /os\.system\s*\([^)]*\+/, name: "Shell Injection via os.system" },
  {
    pattern: /subprocess\.[a-z]+\s*\([^)]*shell\s*=\s*True/,
    name: "Shell Injection via subprocess",
  },
  { pattern: /eval\s*\([^)]*\+/, name: "Eval with concatenation" },
  { pattern: /exec\s*\([^)]*\+/, name: "Exec with concatenation" },
  { pattern: /\$\{[^}]+\}.*query|query.*\$\{/, name: "Potential SQL Injection" },
];

export async function fetchRepoContents(owner: string, repo: string): Promise<RepoAnalysis> {
  const files: RepoFile[] = [];
  const apiBase = `https://api.github.com/repos/${owner}/${repo}`;

  async function fetchTree(path: string = ""): Promise<void> {
    const url = path ? `${apiBase}/contents/${path}` : `${apiBase}/contents`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "ISI-Diagnostician",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const items = await response.json();

    for (const item of items) {
      if (item.type === "file" && item.size < 500000) {
        const ext = item.name.split(".").pop()?.toLowerCase() || "";
        const analyzeExtensions = [
          "js",
          "ts",
          "tsx",
          "jsx",
          "py",
          "rb",
          "go",
          "rs",
          "java",
          "toml",
          "json",
          "yaml",
          "yml",
          "nix",
          "md",
          "txt",
          "html",
          "css",
          "sh",
          "env",
        ];

        if (
          analyzeExtensions.includes(ext) ||
          item.name === ".replit" ||
          item.name === ".gitignore" ||
          item.name === "Dockerfile"
        ) {
          try {
            const contentResponse = await fetch(item.download_url);
            if (contentResponse.ok) {
              const content = await contentResponse.text();
              files.push({
                path: item.path,
                content,
                size: item.size,
              });
            }
          } catch (e) {
            console.warn(`Failed to fetch ${item.path}:`, e);
          }
        }
      } else if (
        item.type === "dir" &&
        !item.name.startsWith(".") &&
        item.name !== "node_modules" &&
        item.name !== "__pycache__" &&
        item.name !== "dist" &&
        item.name !== "build"
      ) {
        await fetchTree(item.path);
      }
    }
  }

  await fetchTree();

  const hasReplitConfig = files.some((f) => f.path === ".replit");
  const hasNixConfig = files.some((f) => f.path === "replit.nix");
  const hasPackageJson = files.some((f) => f.path === "package.json");
  const hasRequirementsTxt = files.some((f) => f.path === "requirements.txt");
  const hasGitignore = files.some((f) => f.path === ".gitignore");

  let primaryLanguage = "unknown";
  const jsFiles = files.filter((f) => /\.(js|ts|tsx|jsx)$/.test(f.path)).length;
  const pyFiles = files.filter((f) => /\.py$/.test(f.path)).length;
  const goFiles = files.filter((f) => /\.go$/.test(f.path)).length;

  if (jsFiles >= pyFiles && jsFiles >= goFiles) primaryLanguage = "javascript";
  else if (pyFiles >= goFiles) primaryLanguage = "python";
  else if (goFiles > 0) primaryLanguage = "go";

  return {
    files,
    hasReplitConfig,
    hasNixConfig,
    hasPackageJson,
    hasRequirementsTxt,
    hasGitignore,
    primaryLanguage,
  };
}

export function analyzeConfiguration(analysis: RepoAnalysis): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];

  if (!analysis.hasReplitConfig) {
    findings.push({
      file: ".replit",
      category: "Configuration",
      severity: "Medium",
      description:
        "Missing .replit configuration file. Replit may not know how to run this project correctly.",
      recommendation: "Create a .replit file with appropriate run command and language settings.",
    });
  } else {
    const replitFile = analysis.files.find((f) => f.path === ".replit");
    if (replitFile) {
      if (!replitFile.content.includes("run =")) {
        findings.push({
          file: ".replit",
          category: "Configuration",
          severity: "High",
          description: "The .replit file is missing a 'run' command.",
          recommendation: "Add a 'run' command to specify how to start the application.",
        });
      }
    }
  }

  if (analysis.primaryLanguage === "javascript" && !analysis.hasPackageJson) {
    findings.push({
      file: "package.json",
      category: "Dependencies",
      severity: "Critical",
      description: "JavaScript project is missing package.json. Dependencies cannot be installed.",
      recommendation: "Create a package.json file with project dependencies using 'npm init'.",
    });
  }

  if (analysis.primaryLanguage === "python" && !analysis.hasRequirementsTxt) {
    findings.push({
      file: "requirements.txt",
      category: "Dependencies",
      severity: "High",
      description: "Python project is missing requirements.txt. Dependencies may not be installed.",
      recommendation: "Create a requirements.txt file listing all Python dependencies.",
    });
  }

  if (!analysis.hasGitignore) {
    findings.push({
      file: ".gitignore",
      category: "Version Control",
      severity: "Medium",
      description: "Missing .gitignore file. Sensitive files or build artifacts may be committed.",
      recommendation:
        "Add a .gitignore file to exclude node_modules/, __pycache__/, .env, and other unnecessary files.",
    });
  } else {
    const gitignore = analysis.files.find((f) => f.path === ".gitignore");
    if (gitignore) {
      const content = gitignore.content.toLowerCase();
      if (!content.includes("node_modules") && analysis.primaryLanguage === "javascript") {
        findings.push({
          file: ".gitignore",
          category: "Version Control",
          severity: "Medium",
          description: ".gitignore does not exclude node_modules directory.",
          recommendation: "Add 'node_modules/' to .gitignore to avoid committing dependencies.",
        });
      }
      if (!content.includes(".env")) {
        findings.push({
          file: ".gitignore",
          category: "Security",
          severity: "High",
          description: ".gitignore does not exclude .env files which may contain secrets.",
          recommendation: "Add '.env' and '.env.*' to .gitignore to prevent leaking secrets.",
        });
      }
    }
  }

  return findings;
}

export function analyzeCodeQuality(analysis: RepoAnalysis): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];

  for (const file of analysis.files) {
    const lines = file.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      for (const pattern of HARDCODED_PATH_PATTERNS) {
        if (pattern.pattern.test(line)) {
          findings.push({
            file: file.path,
            line: lineNum,
            category: "Portability",
            severity: "High",
            description: `Hardcoded ${pattern.name} detected. This will fail on Replit.`,
            recommendation: "Use relative paths or environment variables for file paths.",
          });
        }
      }

      if (/\.(listen|bind)\s*\(\s*(["']localhost["']|["']127\.0\.0\.1["'])/.test(line)) {
        findings.push({
          file: file.path,
          line: lineNum,
          category: "Networking",
          severity: "Critical",
          description:
            "Server binds to localhost/127.0.0.1 which prevents external access on Replit.",
          recommendation: "Change the host binding to '0.0.0.0' to allow external connections.",
        });
      }
    }
  }

  return findings;
}

export function analyzeSecurity(analysis: RepoAnalysis): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];

  for (const file of analysis.files) {
    if (file.path.includes("node_modules") || file.path.includes(".git")) continue;

    const lines = file.content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      for (const secret of SECRET_PATTERNS) {
        if (secret.pattern.test(line)) {
          findings.push({
            file: file.path,
            line: lineNum,
            category: "Security",
            severity: "Critical",
            description: `Potential ${secret.name} hardcoded in source code.`,
            recommendation:
              "Remove this secret immediately and use Replit Secrets to store sensitive values securely.",
          });
        }
      }

      for (const danger of DANGEROUS_PATTERNS) {
        if (danger.pattern.test(line)) {
          findings.push({
            file: file.path,
            line: lineNum,
            category: "Security",
            severity: "High",
            description: `${danger.name} detected. This is a potential security vulnerability.`,
            recommendation:
              "Sanitize user inputs and avoid using shell=True or eval with user-controlled data.",
          });
        }
      }
    }
  }

  return findings;
}

export function analyzePerformance(analysis: RepoAnalysis): DiagnosticFinding[] {
  const findings: DiagnosticFinding[] = [];

  for (const file of analysis.files) {
    if (file.size > 100000) {
      findings.push({
        file: file.path,
        category: "Performance",
        severity: "Medium",
        description: `Large file (${Math.round(file.size / 1024)}KB) in repository increases clone time.`,
        recommendation: "Consider using external storage or Git LFS for large files.",
      });
    }

    const content = file.content;

    if (/\.read\(\)|readFileSync|json\.load\(open\(/.test(content)) {
      if (file.path.endsWith(".py") || file.path.endsWith(".js") || file.path.endsWith(".ts")) {
        const lines = content.split("\n");
        for (let i = 0; i < lines.length; i++) {
          if (/\.read\(\)|readFileSync|json\.load\(open\(/.test(lines[i])) {
            findings.push({
              file: file.path,
              line: i + 1,
              category: "Performance",
              severity: "Medium",
              description:
                "File read into memory may cause issues with large files on Replit's limited RAM.",
              recommendation: "Consider using streaming or chunked reading for large files.",
            });
          }
        }
      }
    }

    if (
      /for\s+.*\s+in\s+.*:\s*\n\s*for\s+.*\s+in/.test(content) ||
      /\.forEach\([^)]*\)\s*{\s*[^}]*\.forEach/.test(content)
    ) {
      findings.push({
        file: file.path,
        category: "Performance",
        severity: "Low",
        description:
          "Nested loops detected which may be CPU-intensive on Replit's shared resources.",
        recommendation: "Consider optimizing nested loops or using more efficient algorithms.",
      });
    }
  }

  return findings;
}

export function generateCorrectedSnippets(
  analysis: RepoAnalysis,
  findings: DiagnosticFinding[],
): CorrectedSnippet[] {
  const snippets: CorrectedSnippet[] = [];

  const hasNetworkIssue = findings.some(
    (f) => f.category === "Networking" && f.severity === "Critical",
  );
  if (hasNetworkIssue) {
    if (analysis.primaryLanguage === "javascript") {
      snippets.push({
        file: "server.js",
        language: "javascript",
        original: `app.listen(3000, 'localhost', () => {
  console.log('Server running on localhost:3000');
});`,
        corrected: `app.listen(3000, '0.0.0.0', () => {
  console.log('Server running on 0.0.0.0:3000');
});`,
        description: "Change server binding from localhost to 0.0.0.0 for Replit compatibility",
      });
    } else if (analysis.primaryLanguage === "python") {
      snippets.push({
        file: "app.py",
        language: "python",
        original: `app.run(host='localhost', port=5000)`,
        corrected: `app.run(host='0.0.0.0', port=5000)`,
        description: "Change Flask host from localhost to 0.0.0.0 for Replit compatibility",
      });
    }
  }

  if (!analysis.hasReplitConfig) {
    if (analysis.primaryLanguage === "javascript") {
      snippets.push({
        file: ".replit",
        language: "toml",
        corrected: `run = "npm start"
language = "nodejs"

[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "npm start"]
deploymentTarget = "cloudrun"`,
        description: "Create .replit configuration file for Node.js project",
      });
    } else if (analysis.primaryLanguage === "python") {
      snippets.push({
        file: ".replit",
        language: "toml",
        corrected: `run = "python main.py"
language = "python3"

[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "python main.py"]
deploymentTarget = "cloudrun"`,
        description: "Create .replit configuration file for Python project",
      });
    }
  }

  if (!analysis.hasGitignore) {
    if (analysis.primaryLanguage === "javascript") {
      snippets.push({
        file: ".gitignore",
        language: "gitignore",
        corrected: `node_modules/
.env
.env.*
*.log
.DS_Store
dist/
build/
.cache/`,
        description: "Create .gitignore for Node.js project",
      });
    } else if (analysis.primaryLanguage === "python") {
      snippets.push({
        file: ".gitignore",
        language: "gitignore",
        corrected: `__pycache__/
*.pyc
.env
.env.*
*.log
.DS_Store
venv/
.venv/
*.egg-info/`,
        description: "Create .gitignore for Python project",
      });
    }
  }

  return snippets;
}

export function generateHealthAssessment(findings: DiagnosticFinding[]): string {
  const criticalCount = findings.filter((f) => f.severity === "Critical").length;
  const highCount = findings.filter((f) => f.severity === "High").length;
  const mediumCount = findings.filter((f) => f.severity === "Medium").length;
  const lowCount = findings.filter((f) => f.severity === "Low").length;

  const hasSecurityIssues = findings.some(
    (f) => f.category === "Security" && (f.severity === "Critical" || f.severity === "High"),
  );
  const hasConfigIssues = findings.some(
    (f) => f.category === "Configuration" && (f.severity === "Critical" || f.severity === "High"),
  );
  const hasNetworkIssues = findings.some(
    (f) => f.category === "Networking" && f.severity === "Critical",
  );

  let assessment = "";

  if (criticalCount === 0 && highCount === 0) {
    assessment = "This project is in good health and appears ready for deployment on Replit. ";
    if (mediumCount > 0) {
      assessment += `There are ${mediumCount} medium-severity recommendations that should be addressed for optimal performance. `;
    }
    if (lowCount > 0) {
      assessment += `Additionally, ${lowCount} best-practice suggestions have been identified.`;
    }
  } else {
    assessment = "This project requires attention before deployment on Replit. ";

    if (hasSecurityIssues) {
      assessment +=
        "CRITICAL: Hardcoded credentials or security vulnerabilities were detected and must be addressed immediately. ";
    }
    if (hasNetworkIssues) {
      assessment +=
        "The web server is configured to bind to localhost, which will prevent external access on Replit. ";
    }
    if (hasConfigIssues) {
      assessment += "Configuration issues may prevent the project from running correctly. ";
    }

    assessment += `Total issues found: ${criticalCount} critical, ${highCount} high-severity, ${mediumCount} medium-severity, and ${lowCount} low-severity.`;
  }

  return assessment;
}

export function generateFullReport(
  repoUrl: string,
  findings: DiagnosticFinding[],
  snippets: CorrectedSnippet[],
  healthAssessment: string,
): string {
  const criticalCount = findings.filter((f) => f.severity === "Critical").length;
  const highCount = findings.filter((f) => f.severity === "High").length;
  const mediumCount = findings.filter((f) => f.severity === "Medium").length;
  const lowCount = findings.filter((f) => f.severity === "Low").length;

  let report = `# Diagnostic Report\n\n`;
  report += `## Executive Summary\n\n`;
  report += `**Repository:** ${repoUrl}\n\n`;
  report += `**Overall Health Assessment:** ${healthAssessment}\n\n`;
  report += `**Findings Overview:**\n`;
  report += `- Critical Issues: ${criticalCount}\n`;
  report += `- High-Severity Issues: ${highCount}\n`;
  report += `- Medium-Severity Issues: ${mediumCount}\n`;
  report += `- Low-Severity/Best Practice Recommendations: ${lowCount}\n\n`;

  report += `## Detailed Audit Findings\n\n`;

  if (findings.length === 0) {
    report += `No issues detected. The repository appears to be well-configured for Replit.\n\n`;
  } else {
    report += `| File:Line | Issue Category | Severity | Detailed Description | Actionable Recommendation |\n`;
    report += `|-----------|----------------|----------|----------------------|---------------------------|\n`;

    const sortedFindings = [...findings].sort((a, b) => {
      const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    for (const finding of sortedFindings) {
      const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
      report += `| ${location} | ${finding.category} | ${finding.severity} | ${finding.description.replace(/\|/g, "\\|")} | ${finding.recommendation.replace(/\|/g, "\\|")} |\n`;
    }
    report += `\n`;
  }

  report += `## Corrected Code & Configuration Snippets\n\n`;

  if (snippets.length === 0) {
    report += `The identified issues require manual logical changes and architectural refactoring that cannot be automatically represented in corrected code snippets. Please refer to the actionable recommendations in the Detailed Audit Findings table to implement the necessary fixes.\n`;
  } else {
    for (const snippet of snippets) {
      report += `### ${snippet.file}\n\n`;
      report += `${snippet.description}\n\n`;

      if (snippet.original) {
        report += `**Before:**\n\`\`\`${snippet.language}\n${snippet.original}\n\`\`\`\n\n`;
        report += `**After:**\n`;
      }

      report += `\`\`\`${snippet.language}\n${snippet.corrected}\n\`\`\`\n\n`;
    }
  }

  return report;
}

export async function runDiagnostics(repoUrl: string): Promise<{
  findings: DiagnosticFinding[];
  snippets: CorrectedSnippet[];
  healthAssessment: string;
  fullReport: string;
  analyzedFiles: string[];
  counts: { critical: number; high: number; medium: number; low: number };
}> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error(
      "Invalid GitHub URL. Please provide a URL in the format: https://github.com/owner/repo",
    );
  }

  const [, owner, repo] = match;
  const repoName = repo.replace(/\.git$/, "");

  const analysis = await fetchRepoContents(owner, repoName);

  const configFindings = analyzeConfiguration(analysis);
  const codeFindings = analyzeCodeQuality(analysis);
  const securityFindings = analyzeSecurity(analysis);
  const performanceFindings = analyzePerformance(analysis);

  const allFindings = [
    ...configFindings,
    ...codeFindings,
    ...securityFindings,
    ...performanceFindings,
  ];
  const snippets = generateCorrectedSnippets(analysis, allFindings);
  const healthAssessment = generateHealthAssessment(allFindings);
  const fullReport = generateFullReport(repoUrl, allFindings, snippets, healthAssessment);

  return {
    findings: allFindings,
    snippets,
    healthAssessment,
    fullReport,
    analyzedFiles: analysis.files.map((f) => f.path),
    counts: {
      critical: allFindings.filter((f) => f.severity === "Critical").length,
      high: allFindings.filter((f) => f.severity === "High").length,
      medium: allFindings.filter((f) => f.severity === "Medium").length,
      low: allFindings.filter((f) => f.severity === "Low").length,
    },
  };
}
