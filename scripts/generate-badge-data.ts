import fs from "fs";
import { execSync } from "child_process";
import { createBadge } from "./create-badge";

const coverageReport = "./coverage/coverage-summary.json"; // Adjust the path as needed
const packageJson = "./package.json"; // Adjust the path as needed
const badges: {
  filename: string;
  label: string;
  message: string;
  color: string;
}[] = [];

function determineColor(coverage) {
  if (coverage >= 80) {
    return "green";
  } else if (coverage >= 50) {
    return "yellow";
  } else {
    return "red";
  }
}

function addBadge(options: {
  filename: string;
  label: string;
  message: string;
  color: string;
}) {
  const { filename, label, message, color } = options;
  badges.push({ filename, label, message, color });
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

  addBadge({
    filename: "coverage.svg",
    label: "Coverage",
    message: `${linesCoverage}%`,
    color,
  });
} else {
  console.error("Coverage report not found.");
  process.exit(1);
}

// Check NPM dependencies
const dependenciesStatus = checkNpmDependencies();
addBadge({
  filename: "depedencies.svg",
  label: "Dependencies",
  message: dependenciesStatus,
  color: dependenciesStatus === "up-to-date" ? "green" : "red",
});

// Get current release version
const releaseVersion = getCurrentReleaseVersion();
addBadge({
  filename: "release.svg",
  label: "Release Version",
  message: releaseVersion,
  color: "blue",
}); // Color can be adjusted

(async () => {
  for (const badge of badges) {
    await createBadge({
      ...badge,
      gistID: process.env.GIST_ID || "",
      githubToken: process.env.GITHUB_TOKEN || "",
    });
  }
})();
