import fs from "fs";

const coverageReport = "./coverage/coverage-summary.json"; // Adjust the path as needed

function determineColor(coverage) {
  if (coverage >= 80) {
    return "green";
  } else if (coverage >= 50) {
    return "yellow";
  } else {
    return "red";
  }
}

if (fs.existsSync(coverageReport)) {
  const coverage = JSON.parse(fs.readFileSync(coverageReport, "utf8"));
  const linesCoverage = coverage.total.lines.pct; // Extracting line coverage percentage
  const color = determineColor(linesCoverage);

  console.log(`::set-output name=coverage-label::Coverage`);
  console.log(`::set-output name=coverage-message::${linesCoverage}%`);
  console.log(`::set-output name=coverage-color::${color}`);
} else {
  console.error("Coverage report not found.");
  process.exit(1);
}
