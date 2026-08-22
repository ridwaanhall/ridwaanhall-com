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
touch anything. `drizzle/0000_*.sql` is the schema and
`drizzle/0002_enable_row_level_security.sql` closes the PostgREST surface — run
both against a fresh project.

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
│   ├── admin/              # The admin — two dynamic routes, 18 screens
│   └── api/                # The few JSON endpoints
├── components/
│   ├── site/               # Page components
│   ├── admin/              # Generic changelist, form, field, inline
│   ├── layout/             # Sidebar, drawer, search palette, theme toggle
│   └── providers/          # Toasts, confirm dialog, tooltips, theme
├── lib/
│   ├── data/               # Read paths, each behind `use cache`
│   ├── actions/            # Server actions
│   ├── admin/              # The descriptors that drive every admin screen
│   ├── auth/               # Auth.js adapter over the existing accounts
│   ├── db/                 # Drizzle schema and the connection pool
│   ├── email/              # Templates and the Resend client
│   ├── seo/                # Metadata, JSON-LD, sitemaps
│   └── storage/            # Supabase Storage and reference-counted cleanup
├── drizzle/                # Migrations and the introspection baseline
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
- **Naming**: descriptive over short. A reader who has not seen the Django build
  should still follow it

#### Comments explain why, not what

This codebase is unusually heavily commented, and deliberately so — much of it
records a decision that looks arbitrary until you know what went wrong without
it. If the reason for a line is not evident from the line, write it down. If it
is, do not.

`CLAUDE.md` collects the ones that have bitten more than once: layouts are not
auth gates, Django's cascades were Python rather than SQL, Tailwind scans prose
and prose names classes. Read it before changing anything in those areas.

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
- **Images**: `next/image`, with dimensions and sensible `sizes`

#### CSS / Tailwind

- The site is written entirely in **dark-mode classes with no `dark:` variants**.
  Light mode is produced by redefining the palette variables under
  `html[data-theme="light"]` in `app/globals.css`
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

Use conventional commit format:

```txt
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Commit Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(dashboard): add GitHub contribution graph integration

- Implement GitHub API client for fetching contribution data
- Add interactive contribution graph component
- Include responsive design for mobile devices

Closes #45
```

```bash
fix(blog): resolve pagination issue on mobile devices

- Fix pagination component overflow on small screens
- Improve touch interactions for pagination buttons
- Add proper spacing for mobile navigation

Fixes #123
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

**There is no test runner, and that is a deliberate choice rather than a gap.**
Everything worth checking here involves a real browser, a real database or both:
whether a gate leaks data in a payload nobody looks at, whether saving a record
untouched changes its bytes, whether a table pushes the page sideways at 360px.
A unit test sees none of that.

So verification is a set of harnesses under `scripts/`, each covering one
mechanism, each driving the running application against the live database.

```bash
npm run dev                     # in one terminal

npx tsc --noEmit
npm run lint
npm run build && node scripts/check-css-sources.mjs
npx tsx scripts/check-rls.mjs
npx tsx scripts/check-admin.mjs
```

`CLAUDE.md` lists all of them and says which need `--conditions=react-server`.

### Writing one

Three rules, learned the hard way:

1. **Snapshot and restore.** Anything that writes must put back what it touched,
   in a `finally`, and then assert the restore worked. The database is live.
2. **Mark what you create.** Rows a harness creates carry a `zz-` prefix, so a
   leftover is obviously a harness's and not real content.
3. **Prove the check can fail.** Break the thing deliberately, watch the check
   go red, then fix it. A check that has never failed is not known to work —
   two in this repo were passing against bugs until that was done.

CI runs types, lint and the build only. The harnesses drive a browser and write
to the live database, which is right for a developer checking a change before
pushing it and wrong for a pull request from a fork.

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
- Python Version: [e.g. 3.12]
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

`README.md`, `CONTRIBUTING.md` and `CLAUDE.md` all describe how this works, and
`MIGRATION.md` records why it is shaped this way. If a change makes one of them
wrong, fix it in the same commit — a stale instruction costs more than a missing
one.

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
- [Python Style Guide (PEP 8)](https://pep8.org/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

## Recognition

Contributors will be recognized in the following ways:

- **GitHub Contributors**: Automatic recognition via GitHub
- **Changelog**: Major contributions mentioned in release notes
- **Documentation**: Contributor acknowledgments in README.md

## License

By contributing to this project, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to ridwaanhall.com! Your efforts help make this project better for everyone. 🚀

**Questions?** Feel free to reach out via [email](mailto:hi@ridwaanhall.com) or create an issue for clarification.
