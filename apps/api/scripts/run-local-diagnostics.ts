import fs from "fs";
import path from "path";
import {
  analyzeConfiguration,
  analyzeCodeQuality,
  analyzeSecurity,
  analyzePerformance,
  RepoAnalysis,
  RepoFile,
  generateHealthAssessment,
  generateFullReport,
  generateCorrectedSnippets,
} from "../src/diagnostics-service.js";

// Recursive file walker
function getAllFiles(dirPath: string, arrayOfFiles: RepoFile[] = []): RepoFile[] {
  const files = fs.readdirSync(dirPath);

  files.forEach(function (file) {
    if (
      file === "node_modules" ||
      file === ".git" ||
      file === "dist" ||
      file === ".turbo" ||
      file === "coverage"
    )
      return;

    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // Filter interesting files
      if (
        /\.(ts|tsx|js|jsx|json|md|css|html|py|go|env)$/.test(file) ||
        file === "package.json" ||
        file === "tsconfig.json" ||
        file === ".gitignore" ||
        file === ".replit"
      ) {
        try {
          const content = fs.readFileSync(fullPath, "utf8");
          const size = fs.statSync(fullPath).size;
          const relativePath = path.relative(process.cwd(), fullPath);
          arrayOfFiles.push({
            path: relativePath,
            content,
            size,
          });
        } catch (e) {
          console.warn(`Skipping file ${fullPath}: ${e}`);
        }
      }
    }
  });

  return arrayOfFiles;
}

const rootDir = process.cwd();
console.log(`Scanning root: ${rootDir}`);

const files = getAllFiles(rootDir);
console.log(`Scanned ${files.length} files.`);

// Mock analysis
const analysis: RepoAnalysis = {
  files,
  hasReplitConfig: files.some((f) => f.path === ".replit"),
  hasNixConfig: files.some((f) => f.path === "replit.nix"),
  hasPackageJson: files.some((f) => f.path === "package.json"),
  hasRequirementsTxt: files.some((f) => f.path === "requirements.txt"),
  hasGitignore: files.some((f) => f.path === ".gitignore"),
  primaryLanguage: "typescript",
};

console.log("Analyzing configuration...");
const configFindings = analyzeConfiguration(analysis);
console.log("Analyzing code quality...");
const codeFindings = analyzeCodeQuality(analysis);
console.log("Analyzing security...");
const securityFindings = analyzeSecurity(analysis);
console.log("Analyzing performance...");
const performanceFindings = analyzePerformance(analysis);

const allFindings = [
  ...configFindings,
  ...codeFindings,
  ...securityFindings,
  ...performanceFindings,
];

console.log(`Found ${allFindings.length} issues.`);

const snippets = generateCorrectedSnippets(analysis, allFindings);
const healthAssessment = generateHealthAssessment(allFindings);
const report = generateFullReport("Local Analysis", allFindings, snippets, healthAssessment);
fs.writeFileSync("diagnostic-report.md", report);
console.log("Report written to diagnostic-report.md");
