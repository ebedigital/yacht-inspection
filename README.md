# Combined Yachting Monthly Inspection — V1.4 Boat Manager

## What changed
- Retains the familiar V1.4 design and black/red PDF branding.
- Beirut preset shows **56 applicable checkpoints**; the 20 N/A items from Travis's September 29, 2026 report are excluded from the inspection and PDF. All **remaining results start blank**, never copied as Pass/Fail.
- Add other boats from **Manage Boats & Checklists**, using the full 76-item master list by default.
- Toggle checklist items on/off for each boat, and add custom single or Port/Starboard checkpoints. PDF reflects the chosen boat-specific list.
- Export/Import Boat List as JSON to move settings across browsers or make backups.
- Save Draft and inspection JSON backup remain local to the browser.

## IMPORTANT limitation
GitHub Pages serves static files only. Boat settings in this edition use **localStorage**, so adding or editing a boat is NOT shared across other devices or browsers. Each inspector needs to import the exported boat list; there is no shared Firebase database, login, or automatic JobTread upload. A future secured database integration is required for centrally managed boats. Because the page is publicly accessible, do not store sensitive real client data in this version.

## Update GitHub Pages with GitHub Desktop
1. Extract the ZIP.
2. Replace `index.html` in your local `yacht-inspection` repository with this `index.html` (optionally copy README.md).
3. In GitHub Desktop commit the changes, then **Push origin**.
4. Reload GitHub Pages after deployment (hard refresh if cached).

## Quick test
1. Select Beirut: expected `56` inspection items; no A/C Units #32 in the form or PDF.
2. Add a new boat: expected `76` inspection items.
3. Manage checklist: uncheck #32 and check the counter decreases to `75` for that boat.
4. Add a custom item; it appears in the appropriate section and PDF.
5. Export boat list, import into a different browser, verify boat-specific settings follow.
