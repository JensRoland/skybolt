# Developing Skybolt

Notes for maintainers on common development tasks.

## Publishing Packages

All language adapter packages use the same release flow:

1. Run `./scripts/release.sh [patch|minor|major]` from the package directory
2. Script bumps version in VERSION file and language-specific files
3. Script commits and pushes to 'skybolt' monorepo
4. Split workflow syncs to the split repo (language-specific)
5. Split repo's `tag-and-publish.yml` creates tag and publishes

### Vite Plugin (@skybolt/vite-plugin)

The vite-plugin uses npm's built-in versioning:

```bash
cd packages/vite-plugin
npm version patch  # or minor/major
```

This runs `scripts/sync-version.js` to update version references, commits, tags, and pushes.

### Language Adapters

```bash
cd packages/[php|python|ruby|go|javascript]
./scripts/release.sh patch   # 3.1.0 → 3.1.1
./scripts/release.sh minor   # 3.1.0 → 3.2.0
./scripts/release.sh major   # 3.1.0 → 4.0.0
```

Use `--no-push` to stage changes without pushing (for review).

## Adding a New Language Adapter

### 1. Create the Package

Create `packages/[language]/` with:

```text
packages/[language]/
├── src/
│   └── [adapter code]
├── scripts/
│   └── release.sh          # Version bump script
├── .github/
│   └── workflows/
│       └── tag-and-publish.yml  # For the split repo
├── VERSION                 # Single source of truth for version
├── LICENSE                 # MIT license
├── README.md
└── [language-specific package file]  # e.g., package.json, composer.json, etc.
```

### 2. Create the Split Repository

1. Create a new repo: `github.com/JensRoland/skybolt-[language]`
2. Initialize as empty repo (no README, .gitignore, or license)

### 3. Generate Deploy Key

The monorepo needs a deploy key to push to the split repo.

```bash
# Generate a new SSH key pair (no passphrase)
ssh-keygen -t ed25519 -C "skybolt-[language]-deploy" -f skybolt-[language]-deploy

# This creates:
# - skybolt-[language]-deploy      (private key)
# - skybolt-[language]-deploy.pub  (public key)
```

### 4. Configure the Deploy Key

**In the split repo** (`skybolt-[language]`):

1. Go to Settings → Deploy keys
2. Click "Add deploy key"
3. Title: `Skybolt [language] deployment`
4. Key: Paste contents of `skybolt-[language]-deploy.pub`
5. Check "Allow write access"
6. Click "Add key"

**In the monorepo** (`skybolt`):

1. Go to Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `[LANGUAGE]_PACKAGE_DEPLOY_KEY` (e.g., `JAVASCRIPT_PACKAGE_DEPLOY_KEY`)
4. Value: Paste contents of `skybolt-[language]-deploy` (private key)
5. Click "Add secret"

**Delete the key files** from your local machine after setup.

### 5. Create the Split Workflow

Create `.github/workflows/split-[language].yml`:

```yaml
name: Split [Language] Package
run-name: Push to skybolt-[language] repo for "${{ github.event.head_commit.message }}"

on:
  push:
    branches:
      - main
    paths:
      - 'packages/[language]/**'
  workflow_dispatch:

jobs:
  split:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Split and push to skybolt-[language] repo
        uses: cpina/github-action-push-to-another-repository@main
        env:
          SSH_DEPLOY_KEY: ${{ secrets.[LANGUAGE]_PACKAGE_DEPLOY_KEY }}
        with:
          source-directory: 'packages/[language]'
          user-email: 'mail@jensroland.com'
          destination-github-username: 'JensRoland'
          destination-repository-name: 'skybolt-[language]'
          target-branch: main
          create-target-branch-if-needed: true
          commit-message: 'Sync from monorepo: ${{ github.sha }}'
```

### 6. Create tag-and-publish.yml for Split Repo

This goes in `packages/[language]/.github/workflows/tag-and-publish.yml` and will be synced to the split repo:

```yaml
name: Tag and Publish

on:
  push:
    branches:
      - main
    paths:
      - 'VERSION'
  workflow_dispatch:

jobs:
  tag-and-publish:
    runs-on: ubuntu-latest
    environment: release
    permissions:
      contents: write
      id-token: write  # For OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Read version
        id: version
        run: echo "version=$(cat VERSION | tr -d '[:space:]')" >> $GITHUB_OUTPUT

      - name: Check if tag exists
        id: check_tag
        run: |
          if git rev-parse "v${{ steps.version.outputs.version }}" >/dev/null 2>&1; then
            echo "exists=true" >> $GITHUB_OUTPUT
          else
            echo "exists=false" >> $GITHUB_OUTPUT
          fi

      - name: Create and push tag
        if: steps.check_tag.outputs.exists == 'false'
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git tag "v${{ steps.version.outputs.version }}"
          git push origin "v${{ steps.version.outputs.version }}"

      # Add language-specific publish steps here
      # See existing adapters for examples
```

### 7. Configure Package Registry

Each language has different registry setup:

| Language   | Registry   | Setup                                               |
| ---------- | ---------- | --------------------------------------------------- |
| JavaScript | NPM        | Configure OIDC trusted publishing                   |
| PHP        | Packagist  | Add webhook in Packagist pointing to the split repo |
| Python     | PyPI       | Configure OIDC trusted publishing at pypi.org       |
| Ruby       | RubyGems   | Configure OIDC trusted publishing                   |
| Go         | Go Modules | Automatic when tag is pushed (no setup needed)      |

### 8. Create an Example

Create `examples/[language]-[framework]/` following the pattern of existing examples:

- `src/css/critical.css` and `src/css/main.css`
- `src/js/app.js`
- `vite.config.js`
- Server/app entry point
- `Makefile` with standard targets
- `Dockerfile` and `docker-compose.yml`
- `README.md`

### 9. Add Smoke Test

Add a test file in `tests/e2e/[example-name].spec.ts` following existing patterns.

## Running Tests

```bash
# Run all smoke tests
cd tests
npm test

# Run specific example test
npm test -- e2e/php-vanilla.spec.ts

# Run tests for an example (from example directory)
cd examples/node-express
make test
```
