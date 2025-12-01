# Developing Skybolt

Notes for maintainers on common development tasks.

## Publishing Language Adapter Packages (Go, PHP, JS, etc.)

All language adapter packages use the same release flow:

1. Run `./scripts/release.sh [patch|minor|major]` from the package directory
2. Script bumps version in VERSION file and language-specific files
3. Script commits and pushes to 'skybolt' monorepo
4. Split workflow syncs to the split repo (language-specific)
5. Split repo's `tag-and-publish.yml` creates tag and publishes

Simply run:

```sh
cd packages/[php|python|ruby|go|javascript]
./scripts/release.sh patch   # 3.1.0 → 3.1.1
./scripts/release.sh minor   # 3.1.0 → 3.2.0
./scripts/release.sh major   # 3.1.0 → 4.0.0
```

Use `--no-push` to stage changes without pushing (for review).

## Skybolt Vite Plugin (@skybolt/vite-plugin)

The `vite-plugin` package uses npm's built-in versioning:

```sh
cd packages/vite-plugin
npm version patch  # or minor/major
```

This runs `scripts/sync-version.js` to update version references, commits, tags, and pushes.

## Chain Lightning (@skybolt/chain-lightning)

The `chain-lightning` package uses npm's built-in versioning:

```sh
cd packages/chain-lightning
npm version patch  # or minor/major
```

This runs `scripts/sync-version.js` to update version references, commits, tags, and pushes.

## Adding A Package To Packagist (PHP)

Go to <https://packagist.org/packages/submit> and submit the GitHub repo URL for the new package.

## Adding A Package To NPM

You cannot publish a new scoped package (`@skybolt/my-package`) to npm using OIDC/provenance for the very first time - you need to publish it manually first to "claim" the package name.

So when you create a new JavaScript package and need to publish it for the first time, do this:

```sh
cd packages/[new-javascript-package]
npm login
npm publish --access public
```

Once published manually, you should also configure the package on npmjs.com to accept provenance from your GitHub repo:

1. Go to <https://www.npmjs.com/settings/skybolt/packages> → (new package) → Settings → Publishing access
2. Under 'Select your publisher', click to connect to GitHub Actions
   1. Org: `skybolt`
   2. Repo name: `[new-javascript-package]`
   3. Workflow file: `tag-and-publish.yml`
   4. Environment: `(leave blank)`
3. Click "Set up connection".
4. Ensure "Require two-factor authentication or a granular access token with bypass 2fa enabled" is set, and click "Update package settings"
5. The OIDC/provenance from GitHub Actions should then work automatically

## Adding a New Language Adapter

### 1. Create the Package

Create `packages/[language]/` with the following structure:

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

Create a new empty repo:

```sh
gh repo create JensRoland/skybolt-[language] --public
```

### 3. Generate Deploy Key

The monorepo needs a deploy key to push to the split repo.

```sh
# Generate a new SSH key pair (no passphrase)
ssh-keygen -t ed25519 -C "skybolt-[language]-deploy" -f skybolt-[language]-deploy

# This creates:
# - skybolt-[language]-deploy      (private key)
# - skybolt-[language]-deploy.pub  (public key)
```

### 4. Configure the Deploy Key

**In the split repo** (`skybolt-[language]`):

1. Go to Settings → Deploy keys, then click "Add deploy key"
   1. Title: `Skybolt [language] deployment`
   2. Paste **public key**
   3. Check "Allow write access"
2. Click "Add key"

**In the monorepo** (`skybolt`):

1. Go to <https://github.com/JensRoland/skybolt/settings/secrets/actions/new> to create a new repository secret
   1. Name: `[LANGUAGE]_PACKAGE_DEPLOY_KEY`
   2. Paste **private key**
2. Click "Add secret"

**Delete the key files** from your local machine after setup.

### 5. Create the Split Workflow

Create `.github/workflows/split-[language].yml`, copy and adapt from existing split workflows.

### 6. Create tag-and-publish.yml for Split Repo

This goes in `packages/[language]/.github/workflows/tag-and-publish.yml` and will be synced to the split repo.

Tweak the publish step according to the language's package registry.

### 7. Configure Package Registry

Each language has different registry setup, but you'll likely need to configure OIDC trusted publishing or webhooks.

## Running Tests

You can't run all the smoke tests from one place, since you first have to build and serve each example. But you can run each example's tests from its directory:

```sh
# Run tests for an example (from example directory)
cd examples/node-express
make test
```
