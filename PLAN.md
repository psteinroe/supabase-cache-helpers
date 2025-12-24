# Documentation Migration Plan: Nextra → Zensical

## Executive Summary

Migrate the Supabase Cache Helpers documentation from Nextra/Next.js to Zensical, a modern static site generator built by the Material for MkDocs creators. This migration will simplify the documentation stack, eliminate Node.js dependencies, and provide a cleaner authoring experience.

## Current State Analysis

### Technology Stack
- **Framework**: Next.js 15.3.1 with Nextra 4.2.17
- **Theme**: nextra-theme-docs 4.2.17
- **Language**: TypeScript/React
- **Dependencies**: React 19, Tailwind CSS, Vercel Analytics
- **Custom Components**: LinkedTabs (synced tab state), TabProvider

### Content Structure
```
docs/
├── app/
│   ├── layout.jsx           # Root layout with metadata, navbar, footer
│   ├── _meta.js             # Top-level navigation config
│   └── [[...mdxPath]]/      # Dynamic MDX routing
├── components/
│   ├── linked-tabs.jsx      # Synchronized tabs across pages
│   └── tab-context.jsx      # React context for tab state
├── content/
│   ├── index.mdx            # Homepage
│   ├── configuration.mdx    # Configuration guide
│   ├── postgrest/           # PostgREST documentation
│   │   ├── _meta.ts         # Navigation config
│   │   ├── getting-started.mdx
│   │   ├── queries.mdx
│   │   ├── mutations.mdx
│   │   ├── subscriptions.mdx
│   │   ├── custom-cache-updates.mdx
│   │   ├── server.mdx
│   │   └── ssr/
│   │       ├── _meta.ts
│   │       ├── react-query.mdx
│   │       └── swr.mdx
│   └── storage/             # Storage documentation
│       ├── _meta.ts
│       ├── getting-started.mdx
│       ├── queries.mdx
│       └── mutations.mdx
├── public/                  # Static assets
├── styles/                  # Global styles
└── package.json
```

### Key Features in Use
- **Callouts**: Warning, info, and note boxes using `<Callout>` component
- **Tabs**: Code examples shown in SWR vs React Query variants
- **Linked Tabs**: Tab selections synchronized across page
- **Code Blocks**: Syntax-highlighted TypeScript/TSX examples
- **Metadata**: SEO metadata, Open Graph, Twitter cards
- **Custom Branding**: Logo, footer, banner
- **Edit Links**: GitHub integration

### Content Inventory
- **14 MDX files** total
- **3 navigation config files** (`_meta.ts`)
- Heavy use of custom React components (`LinkedTabs`, `Callout`)
- Dual framework examples (SWR/React Query) throughout

## Target State: Zensical

### Technology Stack
- **Framework**: Zensical (Python-based static site generator)
- **Language**: Python + Markdown
- **Dependency Management**: uv (modern Python package manager)
- **Configuration**: TOML (zensical.toml)
- **Theme**: Modern variant (default)

### Architecture Benefits
- ✅ No Node.js/npm dependencies
- ✅ Simpler authoring (pure Markdown)
- ✅ Faster builds (Rust + Python)
- ✅ MkDocs ecosystem compatibility
- ✅ Built by Material for MkDocs creators
- ✅ Modern Python tooling with uv

### Zensical Features
- **Admonitions**: `!!! note`, `!!! warning`, `!!! tip`, etc.
- **Tabs**: Content tabs via `pymdownx.tabbed` extension
- **Code Blocks**: Pygments syntax highlighting with line numbers
- **Configuration**: TOML-based (`zensical.toml`)
- **Navigation**: Automatic or explicit nav structure
- **Extensions**: Python-Markdown extensions ecosystem

## Migration Strategy

### Phase 1: Environment Setup
1. **Install uv** (if not already installed)
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Initialize Python project in docs/**
   ```bash
   cd docs/
   uv init
   uv add zensical
   ```

3. **Create initial `zensical.toml`**
   ```toml
   [project]
   site_name = "Supabase Cache Helpers"
   site_url = "https://supabase-cache-helpers.vercel.app"
   site_description = "A collection of framework specific Cache utilities for working with Supabase."
   site_author = "Philipp Steinrötter"
   copyright = "MIT 2025 Supabase Cache Helpers"

   docs_dir = "content"
   site_dir = "site"

   theme = "modern"

   [project.repo]
   url = "https://github.com/psteinroe/supabase-cache-helpers"
   name = "GitHub"

   [[project.social]]
   icon = "twitter"
   link = "https://twitter.com/psteinroe"

   [[project.social]]
   icon = "github"
   link = "https://github.com/psteinroe/supabase-cache-helpers"
   ```

4. **Enable required extensions**
   ```toml
   [markdown_extensions]
   admonition = {}
   pymdownx_details = {}
   pymdownx_superfences = {}
   pymdownx_tabbed = { alternate_style = true }
   pymdownx_highlight = {
     use_pygments = true,
     linenums = true
   }
   codehilite = {}
   ```

### Phase 2: Content Migration

#### 2.1 File Conversion (MDX → MD)

**Strategy**: Convert all `.mdx` files to `.md` files

**Required Transformations**:

1. **Remove import statements**
   ```diff
   - import { Callout, Tabs } from 'nextra/components';
   - import { LinkedTabs } from '@/components/linked-tabs';
   ```

2. **Convert Callouts to Admonitions**
   ```diff
   - <Callout emoji="✅">
   -   Your message here
   - </Callout>
   + !!! success
   +     Your message here
   ```

   Mapping:
   - `<Callout emoji="✅">` → `!!! success`
   - `<Callout emoji="⚠️">` → `!!! warning`
   - `<Callout emoji="🔗">` → `!!! info`
   - `<Callout>` (default) → `!!! note`

3. **Convert LinkedTabs to Content Tabs**
   ```diff
   - <LinkedTabs items={['SWR', 'React Query']} id="data-fetcher">
   -   <Tabs.Tab>
   -     ```tsx
   -     // SWR code
   -     ```
   -   </Tabs.Tab>
   -   <Tabs.Tab>
   -     ```tsx
   -     // React Query code
   -     ```
   -   </Tabs.Tab>
   - </LinkedTabs>

   + === "SWR"
   +
   +     ```tsx
   +     // SWR code
   +     ```
   +
   + === "React Query"
   +
   +     ```tsx
   +     // React Query code
   +     ```
   ```

4. **Update code block syntax**
   - Already compatible! Zensical uses same triple-backtick syntax
   - Optional: Add `linenums="1"` for line numbers
   - Optional: Add `hl_lines="2 3"` for highlighting

5. **Convert inline HTML links to Markdown**
   ```diff
   - <a href="https://supabase.com" alt="Supabase" target="_parent">Supabase</a>
   + [Supabase](https://supabase.com)
   ```

#### 2.2 Navigation Configuration

**Convert `_meta.ts` files to `zensical.toml` nav structure**

Current structure:
```typescript
// content/_meta.ts
export default {
  index: { title: 'Introduction' },
  configuration: 'Configuration',
  postgrest: 'PostgREST',
  storage: 'Storage',
};
```

New structure in `zensical.toml`:
```toml
nav = [
  { "Introduction" = "index.md" },
  { "Configuration" = "configuration.md" },
  { "PostgREST" = [
    { "Getting Started" = "postgrest/getting-started.md" },
    { "Queries" = "postgrest/queries.md" },
    { "Mutations" = "postgrest/mutations.md" },
    { "Subscriptions" = "postgrest/subscriptions.md" },
    { "Custom Cache Updates" = "postgrest/custom-cache-updates.md" },
    { "Server Side Rendering" = [
      { "SWR" = "postgrest/ssr/swr.md" },
      { "React Query" = "postgrest/ssr/react-query.md" }
    ]},
    { "Server Side Caching" = "postgrest/server.md" }
  ]},
  { "Storage" = [
    { "Getting Started" = "storage/getting-started.md" },
    { "Queries" = "storage/queries.md" },
    { "Mutations" = "storage/mutations.md" }
  ]}
]
```

#### 2.3 Linked Tabs Consideration

**Challenge**: Zensical doesn't have built-in linked tabs (synced state)

**Solutions**:
1. **Accept separate tab state** (recommended)
   - Each tab group maintains its own state
   - Simpler, aligns with static site principles
   - Users can still easily compare frameworks

2. **Custom JavaScript** (if synchronized tabs are critical)
   - Add custom JS to track tab selections
   - Store in localStorage
   - Sync on page load
   - More complex, requires custom theme extension

**Recommendation**: Start with option 1. The synchronized tabs are nice-to-have, not critical functionality.

### Phase 3: Asset Migration

1. **Move static assets**
   ```bash
   # Keep public/ directory structure
   # Zensical will automatically serve from public/
   ```

2. **Update asset references**
   - Ensure all image/icon paths use relative links
   - Update OG image paths in configuration

### Phase 4: Build & Development Scripts

Update `package.json` to use Python/uv instead of npm scripts:

```json
{
  "name": "docs",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "dev": "cd docs && uv run zensical serve",
    "build": "cd docs && uv run zensical build",
    "clean": "rm -rf docs/site docs/.venv"
  }
}
```

Or create a `docs/Makefile`:
```makefile
.PHONY: dev build clean

dev:
	uv run zensical serve

build:
	uv run zensical build

clean:
	rm -rf site .venv
```

### Phase 5: Deployment Configuration

**Current**: Vercel deployment for Next.js app

**Options for Zensical**:

1. **Continue with Vercel**
   - Update `vercel.json` or build settings
   - Build command: `cd docs && uv run zensical build`
   - Output directory: `docs/site`
   - Install Python runtime

2. **GitHub Pages**
   - Simple static hosting
   - Create `.github/workflows/docs.yml`:
     ```yaml
     name: Deploy Documentation
     on:
       push:
         branches: [main]
     jobs:
       deploy:
         runs-on: ubuntu-latest
         steps:
           - uses: actions/checkout@v4
           - uses: astral-sh/setup-uv@v1
           - name: Build docs
             run: |
               cd docs
               uv sync
               uv run zensical build
           - name: Deploy to GitHub Pages
             uses: peaceiris/actions-gh-pages@v3
             with:
               github_token: ${{ secrets.GITHUB_TOKEN }}
               publish_dir: ./docs/site
     ```

3. **Netlify, Cloudflare Pages, etc.**
   - Similar static hosting setup
   - Build command: `cd docs && uv run zensical build`

**Recommendation**: Start with Vercel to maintain existing URL structure.

## Implementation Steps

### Step 1: Prepare New Structure (1-2 hours)
- [ ] Install uv globally
- [ ] Create `docs/zensical.toml` configuration
- [ ] Create `docs/pyproject.toml` (auto-generated by uv)
- [ ] Add `.gitignore` entries for Python artifacts

### Step 2: Convert Content (3-4 hours)
- [ ] Create conversion script or manual process
- [ ] Convert index.mdx → index.md
- [ ] Convert configuration.mdx → configuration.md
- [ ] Convert all PostgREST docs (7 files)
- [ ] Convert all Storage docs (3 files)
- [ ] Test each converted file locally

### Step 3: Update Navigation (1 hour)
- [ ] Build full nav structure in zensical.toml
- [ ] Test navigation flow
- [ ] Verify all internal links work

### Step 4: Theme Customization (1-2 hours)
- [ ] Set site colors/branding
- [ ] Configure footer content
- [ ] Add social links
- [ ] Test responsive design

### Step 5: Testing (2 hours)
- [ ] Local build test: `uv run zensical build`
- [ ] Verify all pages render correctly
- [ ] Check all code examples display properly
- [ ] Test all internal/external links
- [ ] Verify search functionality works
- [ ] Mobile responsiveness check

### Step 6: Deployment (1-2 hours)
- [ ] Update deployment configuration
- [ ] Deploy to staging/preview
- [ ] Full QA pass
- [ ] Deploy to production

### Step 7: Cleanup (1 hour)
- [ ] Remove old Next.js files
- [ ] Remove node_modules, package.json from docs/
- [ ] Remove app/, components/ directories
- [ ] Update root-level scripts if needed
- [ ] Update README with new dev instructions

## Content Conversion Reference

### Example Conversion: `getting-started.mdx` → `getting-started.md`

**Before (Nextra/MDX)**:
```mdx
import { Callout, Tabs } from 'nextra/components';
import { LinkedTabs } from '@/components/linked-tabs';

# Getting Started

## Installation

<LinkedTabs items={['SWR', 'React Query']} id="data-fetcher">
  <Tabs.Tab>`pnpm add @supabase-cache-helpers/postgrest-swr`</Tabs.Tab>
  <Tabs.Tab>`pnpm add @supabase-cache-helpers/postgrest-react-query`</Tabs.Tab>
</LinkedTabs>

<Callout emoji="⚠️">
  Make sure to install peer dependencies!
</Callout>
```

**After (Zensical/Markdown)**:
```md
# Getting Started

## Installation

=== "SWR"

    ```bash
    pnpm add @supabase-cache-helpers/postgrest-swr
    ```

=== "React Query"

    ```bash
    pnpm add @supabase-cache-helpers/postgrest-react-query
    ```

!!! warning
    Make sure to install peer dependencies!
```

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Loss of synchronized tabs | Low | Document as known limitation, evaluate user feedback |
| Content formatting errors | Medium | Thorough testing of each page, automated conversion script |
| Deployment complexity | Low | Test deployment to staging first |
| SEO impact from URL changes | Low | Maintain same URL structure, add redirects if needed |
| Learning curve for contributors | Low | Python/Markdown simpler than React/MDX |

## Success Criteria

- [ ] All 14 content pages migrated successfully
- [ ] All code examples render with syntax highlighting
- [ ] Navigation structure matches current site
- [ ] Site builds in < 5 seconds (vs current ~30s)
- [ ] Mobile responsive design maintained
- [ ] Search functionality works
- [ ] All external links functional
- [ ] SEO metadata preserved
- [ ] Deployment pipeline functional

## Maintenance Benefits

**Before (Nextra)**:
- Node.js + npm/pnpm required
- ~300MB node_modules
- Complex React components for simple content
- TypeScript compilation required
- Next.js build process

**After (Zensical)**:
- Python + uv required
- Minimal dependencies (~50MB)
- Pure Markdown content
- No compilation step
- Simple static build

## Timeline Estimate

- **Setup**: 2 hours
- **Content Conversion**: 4 hours
- **Testing**: 2 hours
- **Deployment**: 2 hours
- **Total**: ~10 hours for complete migration

## Rollback Plan

If critical issues arise:
1. Keep current docs/ in a backup branch
2. Revert deployment to Next.js version
3. Debug Zensical issues in parallel
4. Re-deploy when ready

## Post-Migration

### Documentation Updates
- [ ] Update contributor guide with new workflow
- [ ] Document how to run docs locally
- [ ] Add Python/uv installation instructions
- [ ] Update README.md

### Monitoring
- [ ] Monitor analytics for traffic changes
- [ ] Track 404 errors
- [ ] Gather user feedback
- [ ] Monitor build times

## References

- [Zensical Documentation](https://zensical.org/docs/)
- [uv Documentation](https://docs.astral.sh/uv/)
- [Python-Markdown Extensions](https://python-markdown.github.io/extensions/)
- [Material for MkDocs](https://squidfunk.github.io/mkdocs-material/) (Zensical's foundation)

---

## Decision Log

**2024-12-24**: Migration plan created
- Reason: Simplify documentation stack, reduce dependencies
- Approach: Full rewrite of content from MDX to Markdown
- Trade-off: Lose synchronized tabs, gain simplicity
