import fs from "fs";
import { execSync } from "child_process";

let output = "";

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

function writeToOutput(outputName, outputValue) {
  output += `${outputName}=${outputValue}\n`;
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

  writeToOutput("COVERAGE_LABEL", "Coverage");
  writeToOutput("COVERAGE_MESSAGE", `${linesCoverage}%`);
  writeToOutput("COVERAGE_COLOR", color);
} else {
  console.error("Coverage report not found.");
  process.exit(1);
}

// Check NPM dependencies
const dependenciesStatus = checkNpmDependencies();
writeToOutput("DEPEDENCIES_STATUS", dependenciesStatus);

// Get current release version
const releaseVersion = getCurrentReleaseVersion();
writeToOutput("RELEASE_VERSION", releaseVersion);

console.log(output);
