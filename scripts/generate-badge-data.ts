import fs from "fs";
import process from "process";
import { execSync } from "child_process";

const coverageReport = "./coverage/coverage-summary.json"; // Adjust the path as needed
const packageJson = "./package.json"; // Adjust the path as needed

function determineColor(coverage) {
  if (coverage >= 80) {
    return "green";
  } else if (coverage >= 50) {
    return "yellow";
  } else {
    return "red";
  }
}

function writeToOutputFile(outputName, outputValue) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${outputName}=${outputValue}\n`);
  } else {
    console.error("GITHUB_OUTPUT environment variable not found.");
    process.exit(1);
  }
}

function checkNpmDependencies() {
  try {
    execSync("npm outdated");
    return "up-to-date";
  } catch {
    return "outdated";
  }
}

function getCurrentReleaseVersion() {
  if (fs.existsSync(packageJson)) {
    const packageData = JSON.parse(fs.readFileSync(packageJson, "utf8"));
    return packageData.version || "unknown";
  } else {
    return "unknown";
  }
}

// Check coverage
if (fs.existsSync(coverageReport)) {
  const coverage = JSON.parse(fs.readFileSync(coverageReport, "utf8"));
  const linesCoverage = coverage.total.lines.pct;
  const color = determineColor(linesCoverage);

  writeToOutputFile("coverage-label", "Coverage");
  writeToOutputFile("coverage-message", `${linesCoverage}%`);
  writeToOutputFile("coverage-color", color);
} else {
  console.error("Coverage report not found.");
  process.exit(1);
}

// Check NPM dependencies
const dependenciesStatus = checkNpmDependencies();
writeToOutputFile("dependencies-status", dependenciesStatus);

// Get current release version
const releaseVersion = getCurrentReleaseVersion();
writeToOutputFile("release-version", releaseVersion);
