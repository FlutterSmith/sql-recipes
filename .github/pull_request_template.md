## What changes

<!-- One recipe per PR. Link the recipe or issue this is about. -->

## Checklist

- [ ] `uv run cook run` passes on every engine you can reach (CI runs all four)
- [ ] `uv run cook validate` passes, and I ran `uv run cook generate`
- [ ] The shared `query.sql` is standard SQL; engine-specific spellings are in `query.<dialect>.sql`
- [ ] "Differences" names the engine and version where something changed
