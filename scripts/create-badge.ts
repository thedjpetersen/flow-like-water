function processString(str) {
  return str.replace(/-/g, "--").replace(/_/g, "__");
}

type BadgeOptions = {
  gistID: string;
  filename: string;
  label: string;
  message: string;
  color: string;
  githubToken: string;
};

/**
 * Creates a badge image based on provided parameters and uploads it to a specified GitHub Gist.
 * The badge is generated using an external badge service (like shields.io) and then encoded in base64 format
 * for uploading to GitHub Gist.
 *
 * @param {BadgeOptions} options - The options for badge creation and GitHub Gist upload.
 * @param {string} options.gistID - The ID of the Gist where the badge will be uploaded.
 * @param {string} options.filename - The filename for the badge image.
 * @param {string} options.label - The label for the badge (displayed on the left side of the badge).
 * @param {string} options.message - The message for the badge (displayed on the right side of the badge).
 * @param {string} options.color - The color of the badge (affects the right side background of the badge).
 * @param {string} options.githubToken - The GitHub token used for authentication with the GitHub API.
 *
 * @returns {Promise<void>} A promise that resolves when the badge is successfully created and uploaded to the Gist.
 * @throws {Error} Throws an error if there is an issue fetching the badge image or uploading to GitHub Gist.
 *
 * @example
 * const options = {
 *     gistID: 'your-gist-id',
 *     filename: 'badge.svg',
 *     label: 'Dependencies',
 *     message: 'up-to-date',
 *     color: 'green',
 *     githubToken: 'your-github-token'
 * };
 *
 * createBadge(options).then(() => {
 *     console.log('Badge created and uploaded successfully');
 * }).catch(error => {
 *     console.error('Error:', error);
 * });
 */
export async function createBadge({
  gistID,
  filename,
  label,
  message,
  color,
  githubToken,
}: BadgeOptions) {
  const labelProcessed = processString(label);
  const messageProcessed = processString(message);

  const badgeURL = `https://img.shields.io/badge/${encodeURIComponent(
    labelProcessed
  )}-${encodeURIComponent(messageProcessed)}-${color}`;

  try {
    // Fetch the badge image
    console.log(badgeURL);
    const badgeResponse = await fetch(badgeURL);
    const badgeContent = await badgeResponse.text();

    // Prepare payload for GitHub API
    const githubAPIPayload = {
      files: {
        [filename]: {
          content: badgeContent,
        },
      },
    };

    // Upload the badge to GitHub Gist
    const gistResponse = await fetch(`https://api.github.com/gists/${gistID}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify(githubAPIPayload),
    });

    if (!gistResponse.ok) {
      const gistResponseData = await gistResponse.json();
      console.error("Gist API response:", gistResponseData);
      throw new Error(
        `GitHub Gist API responded with status ${gistResponse.status}`
      );
    }

    console.log("Badge uploaded to Gist:", gistID);
  } catch (error) {
    console.error("Error:", error);
  }
}

// Usage example
/*
const options: BadgeOptions = {
  gistID: "your-gist-id",
  filename: "badge.svg",
  label: "Dependencies",
  message: "up-to-date",
  color: "green",
  githubToken: "your-github-token",
};

createBadge(options);
*/
