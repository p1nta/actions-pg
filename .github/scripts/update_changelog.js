const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const BRANCH_PREFIXES = {
  'ui/': '(UI)',
  'server/': '(Server)',
  'regression/': '(Regression)',
  'landing/': '(Landing)',
  'dev/': '(Dev)',
  'api_docs/': '(API Docs)'
};

const unreleasedTitle = '## Unreleased';

function getConfig() {
  const { GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_PR_NUMBER, BRANCH_NAME } = process.env;

  if (!GITHUB_TOKEN || !GITHUB_REPOSITORY || !GITHUB_PR_NUMBER || !BRANCH_NAME) {
    throw new Error('Missing required environment variables');
  }

  return {
    githubToken: GITHUB_TOKEN,
    repo: GITHUB_REPOSITORY,
    prNumber: GITHUB_PR_NUMBER,
    branchName: BRANCH_NAME
  };
}

/** Format the PR title for changelog entry
 * @param {string} title - Original PR title
 * @param {string} prNumber - PR number
 * @param {string} branchName - Branch name
 * @returns {string} Formatted title
 */
function formatTitle(title, prNumber, branchName) {
  // Remove branch prefix from title and capitalize first letter
  const cleanTitle = title
    .replace(/^(ui|server|regression|landing|dev|api_docs)[:.\s-]/i, '')
    .trim();

  const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

  // Find matching branch prefix
  const branchPrefixEntry = Object.entries(BRANCH_PREFIXES)
    .find(([prefix]) => branchName.startsWith(prefix));

  return `- ${formattedTitle} #${prNumber} ${branchPrefixEntry ? ` ${branchPrefixEntry[1]}` : ''}`;
}

async function fetchPRData(config) {
  const response = await fetch(
    `https://api.github.com/repos/${config.repo}/pulls/${config.prNumber}`,
    {
      headers: {
        'Authorization': `token ${config.githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'changelog-updater'
      }
    }
  );

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Insert PR title into "## Unreleased" section
 * @param {string} content - Current changelog content
 * @param {string} prTitle - Formatted PR title to insert
 * @returns {string} Updated changelog content
 */
function updateUnreleasedSection(content, prTitle) {
  const lines = content.split('\n');
  // Find next section index
  const nextSectionIndex = lines.findIndex((line, i) => !line.startsWith(unreleasedTitle) && line.startsWith('##'));

  if (nextSectionIndex === -1) {
    // Remove empty lines
    const filteredLines = lines.filter(line => line.trim() !== '');

    if (filteredLines.length === 0 || !filteredLines[0].startsWith(unreleasedTitle)) {
      filteredLines.unshift(unreleasedTitle);
    }

    // Insert PR title after "## Unreleased"
    filteredLines.splice(1, 0, '', prTitle);
    filteredLines.push('');

    return filteredLines.join('\n');
  }

  // get lines of "## Unreleased" section
  const unreleasedLines = lines.slice(0, nextSectionIndex);
  // Remove empty lines
  const filteredUnreleasedLines = unreleasedLines.filter(line => line.trim() !== '');

  if (filteredUnreleasedLines.length === 0 || !filteredUnreleasedLines[0].startsWith(unreleasedTitle)) {
    filteredUnreleasedLines.unshift(unreleasedTitle);
  }

  // Insert PR title after "## Unreleased"
  filteredUnreleasedLines.splice(1, 0, '', prTitle);
  // insert ## Unreleased section back
  lines.splice(0, nextSectionIndex, ...filteredUnreleasedLines, '');

  return lines.join('\n');
}

async function updateChangelog(
  changelogPath = resolve('./CHANGELOG.md'),
  resultPath = resolve('./CHANGELOG.md'),
  config = getConfig(),
  pullRequestInfo = null
) {
  try {

    // Read current changelog
    const currentContent = readFileSync(changelogPath, 'utf8');

    // Fetch PR data and format title
    const prData = pullRequestInfo || await fetchPRData(config);
    const prTitle = formatTitle(prData.title, prData.number, config.branchName);

    // Update changelog content
    const updatedContent = updateUnreleasedSection(currentContent, prTitle);

    // Write updated changelog
    writeFileSync(resultPath, updatedContent, 'utf8');

    console.log(`✅ Added "${prTitle}" to changelog`);

  } catch (error) {
    console.error('❌ Error updating changelog:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateChangelog();
}

module.exports = { updateChangelog };
