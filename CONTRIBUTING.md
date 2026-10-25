# Contributing to the Precision Farming Ecosystem

Thank you for your interest in contributing! This project follows an open, transparent, and inclusive development model under the **CC0 1.0 Universal** license. All contributions are released into the public domain.

## Getting Started

1. **Fork the repository** at https://github.com/DivergenTechnology/smartfarming-ecosystem
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/smartfarming-ecosystem.git
   cd smartfarming-ecosystem
   ```
3. **Install dependencies**:
   ```bash
   npm install --legacy-peer-deps
   ```
4. **Create a feature branch**:
   ```bash
   git checkout -b feat/<your-feature>
   ```

## Development Workflow

### Commit Message Convention

This project uses **Conventional Commits** for auto-generated changelogs:

| Prefix | Use |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `chore:` | Maintenance tasks (deps, configs) |
| `test:` | Adding or correcting tests |
| `ci:` | CI/CD changes |

Example: `feat(dashboard): add parcel-detail sparkline for 7-day NDVI trend`

### Pull Requests

1. Open a PR against `main`
2. Reference any related issue (e.g., `Closes #42`)
3. CI must pass (lint + build)
4. At least one reviewer approval required
5. Squash-and-merge on approval

### Branch Protection

The `main` branch is protected — direct pushes are rejected. All changes flow through PRs.

## Code Style

- **TypeScript throughout** with strict typing
- **ESLint + Prettier** — run `npm run lint` before commit
- **shadcn/ui components** preferred over custom CSS for UI elements
- **Tailwind utility classes** — no inline styles unless dynamic
- **Mobile-first** — every UI must be responsive (test at 375px, 768px, 1280px)
- **No indigo or blue colors** unless explicitly requested (use emerald/teal/amber for the agriculture theme)

## Project Structure

```
.
├── .github/workflows/ci.yml    # CI pipeline (lint + build on PR)
├── src/
│   ├── app/                     # Next.js App Router (only / route is user-visible)
│   ├── components/
│   │   ├── dashboard/           # Precision farming dashboard components
│   │   └── ui/                  # shadcn/ui components
│   └── lib/                     # Mock data, utils
├── docs/                        # Implementation plan PDF, charts
├── public/                      # Static assets
├── render.yaml                  # Render Blueprint
├── Dockerfile                   # Container build
└── package.json
```

## Issue Reporting

- **Bugs**: Open an issue with the `bug` label, include reproduction steps and screenshots
- **Feature requests**: Open an issue with the `enhancement` label, describe the use case
- **Security vulnerabilities**: See [`SECURITY.md`](./SECURITY.md) — do NOT open a public issue for security reports

## Code of Conduct

Be excellent to each other. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/) in its simplest form.

## License

By contributing, you agree that your contributions are licensed under CC0 1.0 Universal (Public Domain Dedication).
