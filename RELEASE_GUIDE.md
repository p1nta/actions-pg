# Release Guide

This guide documents the workflow for releasing a new version of the application.

## Pre-Release Checklist

Before initiating a release, ensure the following tasks are completed:

### 1. Version and Changelog Updates
- [ ] Verify that `CHANGELOG.md` has been updated with all changes for the upcoming release
- [ ] Ensure the "Unreleased" section in `CHANGELOG.md` has been converted to a proper version section with the format: `## Version X.Y.Z (Month Day, Year)`
- [ ] Update the version in `package.json` to match the version in `CHANGELOG.md`
- [ ] Commit these changes to the `canary` branch with message: `chore: prepare release vX.Y.Z`

### 2. Testing
- [ ] Run all tests and ensure they pass
- [ ] Perform manual testing of key features
- [ ] Verify that all GitHub Actions workflows pass on the `canary` branch
- [ ] Check that there are no blocking issues or critical bugs

### 3. Documentation
- [ ] Update README.md if there are any new features or breaking changes
- [ ] Ensure all documentation is up to date
- [ ] Review any API changes and update relevant documentation

### 4. Dependencies
- [ ] Run `npm audit` and address any critical vulnerabilities
- [ ] Ensure all dependencies are up to date (if applicable)

## Release Process

### Step 1: Create Pull Request
1. Navigate to GitHub and create a new Pull Request
2. Set the base branch to `main`
3. Set the compare branch to `canary`
4. Title the PR: `Release vX.Y.Z`
5. In the PR description, include:
   - Summary of major changes
   - Link to the changelog section
   - Any special notes for reviewers

### Step 2: Review and Merge
1. Request review from team members (if applicable)
2. Address any feedback or requested changes
3. Once approved, **merge the PR** (do not close without merging)

### Step 3: Automated Release
Once the PR is merged, the GitHub Action will automatically:
- Extract the latest version from `CHANGELOG.md`
- Extract the changelog section for that version
- Create a Git tag: `vX.Y.Z`
- Push the tag to the repository
- Create a GitHub Release with:
  - Tag name: `vX.Y.Z`
  - Release title: `Version X.Y.Z`
  - Release description: Content from the latest changelog section

You can monitor the release process in the "Actions" tab on GitHub.

## Post-Release Tasks

After the automated release is complete:

### 1. Verify Release
- [ ] Check that the GitHub Release was created successfully
- [ ] Verify the release notes are correct and complete
- [ ] Ensure the tag was created and pushed

### 2. Update Canary Branch
- [ ] Merge `main` back into `canary` to keep branches in sync
- [ ] Add a new "## Unreleased" section at the top of `CHANGELOG.md` for future changes

### 3. Communication
- [ ] Announce the release to your team/users (if applicable)
- [ ] Update any external documentation or websites
- [ ] Close any issues that were resolved in this release

## Troubleshooting

### Release workflow didn't trigger
- Verify the PR was merged, not just closed
- Check that the PR was from `canary` branch to `main` branch
- Review the Actions tab for any error messages

### Version extraction failed
- Ensure `CHANGELOG.md` follows the format: `## Version X.Y.Z (Date)`
- Check that the version is at the top of the file (after "Unreleased" section)

### Tag already exists
- This means a release with this version was already created
- You'll need to either:
  - Delete the existing tag and release (if it was incorrect)
  - Increment the version number and try again

## GitHub Action Details

The automated release is handled by `.github/workflows/release.yml`, which:
- Triggers on PR close events to the `main` branch
- Only runs if the PR was actually merged (not closed)
- Only runs if the PR came from the `canary` branch
- Requires `contents: write` permission to create tags and releases

## Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR** version (X.0.0): Incompatible API changes or major breaking changes
- **MINOR** version (0.X.0): New features, backwards-compatible
- **PATCH** version (0.0.X): Bug fixes, backwards-compatible

Choose the appropriate version increment based on the changes in your release.
