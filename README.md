# Combined Yachting – Monthly Inspection (GitHub Pages test deployment)

This is the uploaded inspection app, adapted for GitHub Pages. No server or build is required.

## Deploy
1. Make a new GitHub repository (suggested name: `yacht-inspection`).
2. Upload `index.html` and `.nojekyll` in repository root, commit to `main`.
3. In Settings > Pages, select **Deploy from a branch**, branch **main**, folder **/(root)**, Save.
4. Visit `https://YOURUSERNAME.github.io/yacht-inspection/`.

## Important limitations
- This version has 76 actual checklist entries (#1–77 except #15), matching the previously supplied PDF.
- The boat name field has four example suggestions, but NO shared database or real boat management yet.
- `?boat=Start%20Me%20Up` can prepopulate the boat field, but it does not load a unique boat-specific checklist.
- Drafts are in the current browser's localStorage only. They do NOT sync between devices.
- Generated PDF uses Print > Save as PDF.
- No staff login, Firebase connection, automatic JobTread upload, or cloud backup is implemented.
- GitHub Pages is public: do not commit clients' private data, credentials, API keys, downloaded inspection reports, or backups into this repository. Test with non-sensitive information until authenticated cloud storage is implemented.
