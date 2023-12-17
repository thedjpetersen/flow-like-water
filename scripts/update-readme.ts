import { readFile, writeFile } from "fs/promises";

const GIST_ID = process.env.GIST_ID; // Gist ID from environment variable
const README_PATH = "./README.md"; // Path to your README file

async function updateReadmeWithBadges() {
  const gistData = await fetchGistData(process.env.GIST_ID || "");
  const badgesMarkdown = generateBadgesMarkdown(gistData);
  const readmeContent = await readFile(README_PATH, "utf8");

  if (shouldUpdateReadme(readmeContent, badgesMarkdown)) {
    const updatedReadme = insertBadgesIntoReadme(readmeContent, badgesMarkdown);
    await writeFile(README_PATH, updatedReadme);
    console.log("README updated with new badges.");
    return true;
  } else {
    console.log("No updates to badges. README remains unchanged.");
    return false;
  }
}

async function fetchGistData(gistId: string) {
  const response = await fetch(`https://api.github.com/gists/${gistId}`);
  const gist = await response.json();
  return gist.files;
}

function generateBadgesMarkdown(files: any): string {
  return Object.values(files)
    .filter((file: any) => file.filename.endsWith(".svg"))
    .map((file: any) => `![Badge](${file.raw_url})`)
    .join("\n");
}

function shouldUpdateReadme(
  readmeContent: string,
  badgesMarkdown: string
): boolean {
  const startTag = "<!-- BADGES_START -->";
  const endTag = "<!-- BADGES_END -->";
  const startIdx = readmeContent.indexOf(startTag) + startTag.length;
  const endIdx = readmeContent.indexOf(endTag);
  const currentBadges = readmeContent.substring(startIdx, endIdx).trim();

  return currentBadges !== badgesMarkdown.trim();
}

function insertBadgesIntoReadme(
  readmeContent: string,
  badgesMarkdown: string
): string {
  const startTag = "<!-- BADGES_START -->";
  const endTag = "<!-- BADGES_END -->";
  const startIdx = readmeContent.indexOf(startTag) + startTag.length;
  const endIdx = readmeContent.indexOf(endTag);

  return `${readmeContent.substring(
    0,
    startIdx
  )}\n${badgesMarkdown}\n${readmeContent.substring(endIdx)}`;
}

// Execute the function
updateReadmeWithBadges();
