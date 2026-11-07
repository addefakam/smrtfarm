# Security Policy

## Reporting a Vulnerability

**Do NOT open a public issue for security vulnerabilities.**

Instead, email security@addefakam.dev with:
1. A description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We acknowledge all reports within 48 hours and aim to publish a fix within 30 days for high-severity issues.

## Scope

This policy covers the `addefakam/smrtfarm` repository only. Out of scope:
- Vulnerabilities in third-party dependencies (report upstream)
- Vulnerabilities in the production Firebase / PostGIS infrastructure (report to EIAR IT directly)
- Social engineering attacks on project maintainers

## Disclosure

We follow coordinated disclosure:
1. Reporter reports privately
2. Maintainer acknowledges and validates
3. Fix is developed privately
4. Fix is released and a public advisory is published within 7 days of release
5. Reporter is credited (unless they prefer to remain anonymous)

## Security Best Practices (for contributors)

- Never commit secrets, API keys, or credentials to the repository
- Use environment variables (`.env.example` shows required vars; `.env` is gitignored)
- Run `npm audit` regularly and update vulnerable dependencies
- Review dependencies before adding them (prefer packages with active maintenance)
- All PRs that touch authentication, authorization, or data storage must be reviewed by a maintainer
