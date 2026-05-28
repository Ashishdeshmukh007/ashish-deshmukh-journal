# Deploying Ashish Deshmukh Journal

This folder is a plain static website and can be hosted for free.

## Recommended free hosting

### Option 1: GitHub Pages

1. Create a new GitHub repository, for example `ashish-deshmukh-journal`.
2. Copy or push the contents of this `sam-blog-site` folder to the repository root.
3. In GitHub, open **Settings -> Pages**.
4. Set source to **GitHub Actions**.
5. The included workflow at `.github/workflows/pages.yml` will publish the site.

### Option 2: Netlify

1. Create a free Netlify account.
2. Drag-and-drop the `sam-blog-site` folder into Netlify, or connect a GitHub repo.
3. Netlify will use `netlify.toml`; no build step is required.

### Option 3: Vercel

1. Create a free Vercel account.
2. Import the GitHub repo containing this folder.
3. Vercel will serve it as a static site using `vercel.json`.

## Social sharing

Each article has its own URL under `/articles/`. Once hosted, the **Share on LinkedIn** and **Copy link** buttons use the live article URL.

## Publishing new articles

Add each new article under `articles/`, then update:

- `index.html`
- `feed.xml`
- `sitemap.xml`

Keep the byline format:

`By Ashish Deshmukh on <Month Day, Year>`
