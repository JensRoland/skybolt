#!/bin/bash
#
# Release script for Chain Lightning (PHP adapter)
#
# Usage: ./scripts/release.sh [patch|minor|major] [--push]
#
# This script:
# 1. Bumps the version in VERSION file
# 2. Commits the changes (and pushes if --push is specified)
#
# The split repo's tag-version.yml workflow will automatically create the tag.

set -e

BUMP_TYPE=""
PUSH=false

for arg in "$@"; do
    case "$arg" in
        --push)
            PUSH=true
            ;;
        patch|minor|major)
            BUMP_TYPE="$arg"
            ;;
    esac
done

BUMP_TYPE=${BUMP_TYPE:-patch}

if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "Usage: $0 [patch|minor|major] [--push]"
    exit 1
fi

# Get script directory and package directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PACKAGE_DIR"

# Read current version
CURRENT_VERSION=$(cat VERSION | tr -d '[:space:]')
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Bump version
case "$BUMP_TYPE" in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

echo "Bumping version: ${CURRENT_VERSION} → ${NEW_VERSION}"

# Update VERSION file
echo "$NEW_VERSION" > VERSION

echo "Updated: VERSION"

# Commit and optionally push
git add "$PACKAGE_DIR"
git commit -m "chore(php): bump chain lightning to v${NEW_VERSION}"

if [ "$PUSH" = true ]; then
    git push origin main
    echo ""
    echo "✓ Pushed chain lightning (PHP) v${NEW_VERSION}"
    echo ""
    echo "Once synced to the split repo, tag-version.yml will create the v${NEW_VERSION} tag."
else
    echo ""
    echo "✓ Committed chain lightning (PHP) v${NEW_VERSION} (not pushed)"
    echo ""
    echo "Run 'git push origin main' when ready."
fi
