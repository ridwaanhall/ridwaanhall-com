# TailwindCSS Build Setup

This project now includes an automated TailwindCSS build system that works seamlessly with Vercel deployment.

## Files Structure

```
├── static/css/input.css          # TailwindCSS source file
├── staticfiles/css/global.css    # Compiled CSS output (auto-generated)
├── package.json                  # Node.js dependencies and build scripts
└── vercel.json                  # Vercel deployment configuration
```

## Development Commands

```bash
# Build CSS for production (minified)
npm run build:css

# Watch CSS changes during development
npm run dev:css

# Full build (CSS + Django collectstatic)
npm run build
```

## Deployment

The build process is fully automated on Vercel:
1. `npm install` installs TailwindCSS CLI
2. `npm run build:css` compiles TailwindCSS from `static/css/input.css` to `staticfiles/css/global.css`
3. `python manage.py collectstatic` collects all static files
4. WhiteNoise serves the compiled static files

## Key Changes

- **Source files**: `static/` directory is now tracked in git
- **Built files**: `staticfiles/` is ignored in git (built automatically)
- **No manual commands**: No need to run `npx @tailwindcss/cli` manually
- **Vercel ready**: Fully automated deployment with no manual steps

## TailwindCSS Version

Using TailwindCSS v4.1.12 with the modern `@import "tailwindcss"` syntax.