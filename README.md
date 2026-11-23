# Combined Yachting Monthly Inspection – V1.4 Boat Comparison

This update adds four example boat entries to the existing Boat Manager:

- **Beirut** — 56 checkpoints (20 N/A items excluded from the September 29 report)
- **Start Me Up** — 76 checkpoints (full master checklist)
- **Lady Laura** — 76 checkpoints (full master checklist)
- **Executive Decision** — 76 checkpoints (full master checklist)
- **Insatiable** — 76 checkpoints (full master checklist)

The four non-Beirut boats are **demonstration full-checklist templates only**, not confirmed boat-specific checklists. Each can be customized using **Manage Boats & Checklists**. Existing saved boat settings and customizations are preserved by a one-time additive migration.

## Deploy to GitHub Pages
Replace the `index.html` in your local `yacht-inspection` repository with this file. Commit and **Push origin** via GitHub Desktop. Keep `.nojekyll` in the repo. Refresh the site after deployment.

## Important
Boat templates and inspection drafts still save to **this browser only**, not Firebase. Changes on one device will NOT appear on Travis's device unless exported and imported as Boat List JSON. No login or JobTread API upload is implemented. Don't use confidential boat/client data on this publicly available test app.
