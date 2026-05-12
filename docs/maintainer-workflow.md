# Maintainer Workflow

## Review Proposal Issues

Proposal issues contain:

- `Action: add | update | delete`
- Target event id
- Reason
- Event JSON payload for add/update proposals
- Maintainer checklist

Check that the event is public, relevant, non-duplicative, and safe to link.

## Convert an Accepted Proposal Into a Pull Request

1. Create or edit the event file in `data/events/`.
2. Add repository attachments under `data/attachments/<event-id>/` only when they are small and appropriate for the public repository.
3. Update `data/taxonomy.json` only when a new controlled tag is genuinely needed.
4. Run:

```bash
npm run validate:data
npm test
npm run build
```

5. Open a pull request and link the proposal issue.

## Validation Checklist

- Event file name matches the event id.
- Dates are real `YYYY-MM-DD` dates.
- Application deadline is on or before the start date.
- End date is on or after the start date.
- Website and external attachment URLs use `http` or `https`.
- Topic and subtopic ids exist in `data/taxonomy.json`.
- Repository attachment paths point to files that exist.
- The generated index is updated with `npm run generate:index`.

## Release

Merging to `main` triggers the Pages deployment workflow. If deployment fails, inspect the failed workflow step first; validation failures usually point to data shape, taxonomy, or attachment path issues.
