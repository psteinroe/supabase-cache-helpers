_default:
  just --list -u

alias f := format
alias l := lint
alias lf := lint-fix
alias r := ready
alias t := test
alias b := build
alias c := check

# Build all packages
build:
    pnpm turbo run build

# Build packages only (excludes examples)
build-packages:
    pnpm turbo run build --filter='./packages/*'

# Run dev mode
dev:
    pnpm turbo run dev --parallel

# Lint code
lint:
    pnpm oxlint

# Fix lint issues
lint-fix:
    pnpm oxlint --fix

# Format code
format:
    pnpm oxfmt .

# Check formatting
format-check:
    pnpm oxfmt --check .

# Run lint and format check
check:
    pnpm oxlint
    pnpm oxfmt --check .

# Fix lint and format issues
fix:
    pnpm oxlint --fix
    pnpm oxfmt .

# Run all checks (lint + format)
ready:
    just check

# Run tests (optionally for a specific package)
test pkg="" *args:
    @if [ -z "{{pkg}}" ]; then pnpm turbo run test --concurrency=1; else pnpm turbo run test --filter=@supabase-cache-helpers/{{pkg}} -- {{args}}; fi

# Run type checking
typecheck:
    pnpm turbo run typecheck

# Clean all build artifacts and node_modules
clean:
    pnpm turbo run clean
    rm -rf node_modules

# Start Supabase with minimal services for tests (db, postgrest, realtime, storage)
sb-start:
    pnpm supabase start --exclude gotrue,studio,imgproxy,edge-runtime,logflare,vector,postgres-meta,supavisor,mailpit

# Stop Supabase
sb-stop:
    pnpm supabase stop

# Generate Supabase types
typegen:
    pnpm supabase gen types typescript --local > packages/postgrest-swr/tests/database.types.ts
    pnpm supabase gen types typescript --local > packages/postgrest-react-query/tests/database.types.ts
    pnpm supabase gen types typescript --local > packages/postgrest-core/tests/database.types.ts
    pnpm supabase gen types typescript --local > examples/swr/types/database.ts
    pnpm supabase gen types typescript --local > examples/react-query/types/database.ts

# Serve documentation locally
docs:
    cd docs && uv run zensical serve

# Create a changeset
changeset:
    pnpm changeset

# CI: Version bump
ci-version:
    pnpm changeset version
    just fix

# CI: Publish release
ci-release:
    pnpm changeset publish

# Delete merged git branches
clear-branches:
    git branch --merged | egrep -v "(^\\*|main)" | xargs git branch -d

# Merge main into current branch
merge-main:
    git fetch origin main:main
    git merge main

# Reset to main branch
reset-git:
    git checkout main
    git pull
    just clear-branches
