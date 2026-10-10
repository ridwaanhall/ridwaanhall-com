# Contributing to ridwaanhall.com

Thank you for your interest in contributing to this portfolio project! This document provides guidelines and information for contributors to ensure a smooth and effective collaboration process.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Contributing Guidelines](#contributing-guidelines)
- [Coding Standards](#coding-standards)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Documentation](#documentation)
- [Testing](#testing)
- [Security](#security)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before contributing.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 22+**: [Download Node](https://nodejs.org/)
- **Git**: [Download Git](https://git-scm.com/downloads)
- **Code Editor**: VS Code, or your preferred editor
- **A Supabase project**: there is no local database, so you need one of your
  own before you can run anything that writes

### Fork and Clone

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```powershell
   git clone https://github.com/ridwaanhall/ridwaanhall-com.git
   cd ridwaanhall-com
   ```

3. **Add upstream remote**:

   ```powershell
   git remote add upstream https://github.com/ridwaanhall/ridwaanhall-com.git
   ```

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the template and fill it in:

```bash
cp .env.example .env.local
```

**`STORAGE_POSTGRES_URL` is the one thing without which nothing runs** — the app
throws at import if it is missing. Everything else degrades rather than
crashing: no Resend key means no email, no Turnstile key means no spam check, no
GitHub token means no contribution graph.

There is no local database and no fixtures. Whatever you point that URL at is
what `/admin` writes to, so point it at your own Supabase project before you
touch anything. `drizzle/0000_init.sql` is the whole schema — run it once
against a fresh project:

```bash
node scripts/apply-migration.mjs drizzle/0000_init.sql --apply
```

See the README's [Environment Configuration](README.md#environment-configuration)
for the full table.

### 3. Run the Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Project Structure

```txt
ridwaanhall-com/
├── app/                    # Routes
│   ├── (site)/             # The public pages
│   ├── admin/              # The admin — two dynamic routes and the Access screen
│   └── api/                # The few JSON endpoints
├── components/
│   ├── foothill/           # The public site: pages, cards, filters, charts, motion
│   ├── admin/              # Generic changelist, form, field, inline
│   ├── site/, layout/      # The few pieces both halves use
│   ├── auth/, seo/         # Sign-in buttons, structured data
│   └── providers/          # Confirm dialog, notifications, tooltips, theme
├── lib/
│   ├── data/               # Read paths, each behind `use cache`
│   ├── actions/            # Server actions
│   ├── admin/              # The descriptors that drive every admin screen
│   ├── auth/               # Auth.js adapter over the account tables
│   ├── db/                 # The generated Drizzle mapping and the connection pool
│   ├── email/              # Templates and the Resend client
│   ├── markdown/, cv/      # The Markdown twins and the generated CV
│   ├── site/, motion/      # Pure helpers the public site shares
│   ├── seo/                # Metadata, JSON-LD, sitemaps
│   └── storage/            # Supabase Storage and reference-counted cleanup
├── drizzle/                # 0000_init.sql — the whole schema, in one file
├── scripts/                # Verification harnesses
├── styles/                 # Stylesheets app/globals.css imports
└── public/                 # Favicons, fonts, static images
```

### Two things worth knowing before you change anything

**The admin is declarative.** `lib/admin/registry.ts` names every screen and
`lib/admin/models/` declares what each shows and edits; two generic components
render all of them. Adding a screen is adding a descriptor, not writing a page.

**Content is rows, not files.** Bio, experience, education, certifications,
awards, skills, projects, posts and legal documents are all database rows, edited
through `/admin`. Nothing about the site's content lives in this repository.

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes**: Fix existing issues or bugs
- ✨ **New features**: Add new functionality or components
- 📚 **Documentation**: Improve docs, README, or code comments
- 🎨 **UI/UX improvements**: Design enhancements or accessibility
- ⚡ **Performance**: Optimize code, queries, or loading times
- 🔒 **Security**: Security improvements or vulnerability fixes
- 🧪 **Testing**: Add or improve test coverage

### Contribution Workflow

1. **Check existing issues** before starting work
2. **Create an issue** for significant changes
3. **Fork and create a feature branch**
4. **Make your changes** following coding standards
5. **Test your changes** thoroughly
6. **Update documentation** if needed
7. **Submit a pull request**

## Coding Standards

### TypeScript Standards

#### Code Style

- **Formatting**: no formatter is configured. Match the surrounding file
- **Linting**: `npm run lint` must pass, and `npx tsc --noEmit` must be clean
- **Types**: prefer inference; write a type where it documents something. `any`
  is not used anywhere in the codebase and should not start now
- **Naming**: descriptive over short. A reader seeing this code for the first
  time should still follow it

#### Comments explain why, not what

This codebase is unusually heavily commented, and deliberately so — much of it
records a decision that looks arbitrary until you know what went wrong without
it. If the reason for a line is not evident from the line, write it down. If it
is, do not.

`CLAUDE.md` collects the ones that have bitten more than once: a layout is not
an auth gate, row-level security must stay on, Tailwind scans prose and prose
names classes. Read it before changing anything in those areas.

#### Server and client

- Default to server components. Reach for `"use client"` when something needs
  state, an event handler or a browser API — not by habit
- Read paths go in `lib/data/` behind `use cache` with a tag; writes go in
  `lib/actions/` as server actions
- **A server action is a POST endpoint, not a function call.** It does not
  inherit any gate from the page that rendered the form, so it re-checks
  permission itself

### Frontend Standards

#### Markup

- **Semantic HTML**: use the element that means the thing
- **Accessibility**: label every control; anything interactive must work from a
  keyboard, and anything hover-only must also work on touch
- **Images**: on the public site, `SiteImage` (`components/foothill/site-image.tsx`) and never `next/image` directly, because the wrapper is what makes the resize setting apply. Give it dimensions and sensible `sizes`

#### CSS / Tailwind

- The **public site** is written in the class vocabulary of `styles/site.css`
  (`.btn`, `.chip`, `.pcard`, `.wrap`) over eight grey tokens, every rule
  anchored to `.fh-site`; add new rules at the end of that sheet. The **admin**
  is written in stock Tailwind classes, and `styles/theme-light.css` remaps its
  zinc ramp from the site's tokens. Neither uses a `dark:` variant
- **A class in `styles/` beats any utility** on the same property: those sheets
  are unlayered. Do not set one property both ways on one element
- **Stay inside the existing colour vocabulary.** A new colour family, or an
  arbitrary value like `bg-[#18181b]`, renders its dark value on a white page
  with no error anywhere
- **No cast-depth utilities.** They render nothing on a dark canvas while still
  costing paint; depth is carried by the border and surface ramps
- New stylesheets go in `styles/` and are `@import`ed from `app/globals.css`,
  never linked separately

#### Motion

- Respect `prefers-reduced-motion` in anything that moves

## Commit Message Guidelines

Commits are emoji-prefixed conventional commits. The emoji is part of the type,
with no space after it:

```txt
<emoji><type>(<scope>): <Description>

[optional body: what changed, and why]
```

| Emoji | Type | Use |
|---|---|---|
| ✨ | `feat` | A new feature |
| 🐛 | `fix` | A bug fix |
| 💄 | `style` | UI, CSS and design changes |
| 📝 | `docs` | Documentation |
| ✅ | `test` | Adding or updating tests |
| ♻️ | `refactor` | A refactor with no change in behaviour |
| ⚡ | `perf` | Performance |
| 🔒 | `security` | Security changes |
| 🔧 | `chore` | Maintenance and tooling |
| 🔥 | `chore` | Deleting code or files |
| 🚀 | `chore(deploy)` | A rebuild or deploy commit |
| 👷 | `ci` | CI workflows |
| ⏪ | `revert` | Reverting an earlier commit |

### Examples

```bash
🐛fix(gallery): Keep the thumbnail strip six columns wide whatever the image count

The strip was as many columns as there were images, so a project with two
screenshots drew thumbnails half the page wide while one with six drew them a
sixth of it.
```

```bash
✨feat(filters): Put the Work and Writing filters behind a Filters button

The list now opens with one line: search, a Filters button with the number
applied, sort and view. What is applied shows as removable chips.

Closes #45
```

## Pull Request Process

### Before Submitting

1. **Sync with upstream**:

   ```powershell
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create feature branch**:

   ```powershell
   git checkout -b feature/your-feature-name
   ```

3. **Test your changes**:

   ```bash
   npm test
   npx tsc --noEmit
   npm run lint
   npm run build
   ```

### Pull Request Template

When creating a pull request, include:

```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Other (please describe)

## Testing
Which checks you ran, and what you looked at in the browser.

## Screenshots (if applicable)
Include screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly described)
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** and merge by maintainers

## Issue Reporting

### Bug Reports

Include the following information:

```markdown
**Bug Description**
Clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 91]
- Node Version: [e.g. 22.11.0]
```

### Feature Requests

```markdown
**Feature Description**
Clear description of the proposed feature.

**Use Case**
Explain the problem this feature would solve.

**Proposed Solution**
Describe your proposed implementation.

**Additional Context**
Any other context or screenshots.
```

## Documentation

### Code documentation

- **Comments explain why.** The what is in the code. Write a comment when the
  reason for a line would not survive being read fresh in six months — and
  especially when the line looks arbitrary or redundant without it
- **Record the failure, not just the rule.** "`min-w-0` is load-bearing: a grid
  item's min-width defaults to min-content, and a wide table pushed the column
  to 889px in a 360px viewport" is useful. "Set min-width to zero" is not
- **Types over prose.** If a type can say it, let it
- **Update `CLAUDE.md`** when you find a trap that cost you an hour. That file is
  a list of things that have actually gone wrong here, and it earns its length

### When you change something documented

`README.md`, `CONTRIBUTING.md` and `CLAUDE.md` all describe how this works. If a
change makes one of them wrong, fix it in the same commit — a stale instruction
costs more than a missing one.

## Testing

There are two layers, and the split is deliberate.

**Unit tests** cover the pure logic -- permissions, filters, sanitising, parsing,
the pieces that decide things -- and run anywhere: no database, no browser, no
network. Node's built-in runner over `tsx`; there is no test framework.

```bash
npm test
npm run test:watch
```

**Harnesses** cover everything that only means something against the real thing:
whether a gate leaks data in a payload nobody looks at, whether saving a record
untouched changes its bytes, whether a table pushes the page sideways at 360px.
A unit test sees none of that. Each harness under `scripts/` covers one
mechanism and drives the running application against the live database.

```bash
npm run dev                     # in one terminal

npx tsc --noEmit
npm run lint
npm run build && node scripts/check-css-sources.mjs
npx tsx scripts/check-rls.mjs
npx tsx scripts/check-admin.mjs
```

`CLAUDE.md` lists all of them and says which need `--conditions=react-server`.

### Writing a harness

Three rules, learned the hard way:

1. **Snapshot and restore.** Anything that writes must put back what it touched,
   in a `finally`, and then assert the restore worked. The database is live.
2. **Mark what you create.** Rows a harness creates carry a `zz-` prefix, so a
   leftover is obviously a harness's and not real content.
3. **Prove the check can fail.** Break the thing deliberately, watch the check
   go red, then fix it. A check that has never failed is not known to work --
   two in this repo were passing against bugs until that was done.

CI runs the route types, `tsc`, lint, the unit tests and the build. The
harnesses drive a browser and write to the live database, which is right for a
developer checking a change before pushing it and wrong for a pull request from
a fork.

## Security

### Security Guidelines

- **Never commit sensitive data** (API keys, passwords)
- **Use environment variables** for configuration
- **Validate user input** properly
- **Never trust the client.** A server action is a POST endpoint: it re-checks permission itself rather than assuming the page that rendered the form did
- **Report security issues** privately to [hi@ridwaanhall.com](mailto:hi@ridwaanhall.com)

### Security Checklist

- [ ] No hardcoded secrets in code
- [ ] Proper input validation
- [ ] CSRF protection enabled
- [ ] Secure HTTP headers configured
- [ ] Dependencies are up to date

## Getting Help

### Communication Channels

- **GitHub Issues**: For bugs and feature requests
- **Email**: [hi@ridwaanhall.com](mailto:hi@ridwaanhall.com) for private communications
- **LinkedIn**: [in/ridwaanhall](https://linkedin.com/in/ridwaanhall) for professional inquiries

### Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [Auth.js Documentation](https://authjs.dev/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

## Recognition

Contributors will be recognized in the following ways:

- **GitHub Contributors**: Automatic recognition via GitHub
- **Changelog**: Major contributions mentioned in release notes
- **Documentation**: Contributor acknowledgments in README.md

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (Apache License 2.0).

---

Thank you for contributing to ridwaanhall.com! Your efforts help make this project better for everyone. 🚀

**Questions?** Feel free to reach out via [email](mailto:hi@ridwaanhall.com) or create an issue for clarification.
