const fs = require('fs');
const path = require('path');
const child_process = require('child_process');

const githubToken = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY;
const prNumber = process.env.GITHUB_PR_NUMBER;
const branchName = process.env.BRANCH_NAME;

function formatTitle(prTitle, prNumber) {
  const titleContent = prTitle.replace(/^(ui\W|server\W)/i, '').trimStart();
  const title = '- ' + titleContent.charAt(0).toUpperCase() + titleContent.slice(1);

  const titleParts = [title, `#${prNumber}`];

  const isUI = prTitle.match(/^(ui)/i);
  const isServer = prTitle.match(/^(server)/i);

  if (isUI) {
    titleParts.push('(UI)')
  }

  if (isServer) {
    titleParts.push('(Server)')
  }

  return titleParts.join(' ');
}

async function updateChangelog() {
  try {

    const changelogPath = path.resolve('./CHANGELOG.md');
    const data = fs.readFileSync(changelogPath, 'utf8');
    const lines = data.split('\n');

    if (branchName === 'canary') {
      child_process.execSync('npm version patch --no-git-tag-version');

      const packageJsonPath = path.resolve('./package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      const today = new Date();
      const formattedDate = today.toLocaleDateString(
        'en-US',
        { day: 'numeric', month: 'long', year: 'numeric' },
      );

      lines[0] = `## Version ${packageJson.version} (${formattedDate})`
    } else {
      // Fetch PR details from GitHub API
      const prResponse = await fetch(
        `https://api.github.com/repos/${repo}/pulls/${prNumber}`,
        {
          headers: {
            Authorization: `token ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'https://api.github.com',
          },
        }
      );

      if (!prResponse.ok) {
        throw new Error(`Failed to fetch PR details: ${prResponse.statusText}`);
      }
      const prData = await prResponse.json();
      const prTitle = formatTitle(prData.title, prData.number);

      if (lines[0].startsWith('## Unreleased')) {
        lines.splice(1, 0, prTitle);
      } else {
        lines.unshift('## Unreleased', prTitle);
      }
    }

    fs.writeFileSync(changelogPath, lines.join('\n'), 'utf8');
  } catch (error) {
    console.error('Error updating changelog:', error.message);
    process.exit(1);
  }
}

updateChangelog();

