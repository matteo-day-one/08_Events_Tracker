# Contributing

Public contributions are welcome through GitHub proposals and pull requests.

## Propose a Change From the App

Use the app's proposal panel to generate a structured add, update, or delete proposal. Open the generated GitHub issue and include any relevant context.

Maintainers review proposals and decide whether to convert them into pull requests.

## Add or Edit Event Data Directly

1. Add or edit one JSON file in `data/events/`.
2. Keep the event id stable for updates.
3. Use existing topic ids from `data/taxonomy.json`.
4. Put reviewed repository attachments under `data/attachments/<event-id>/`.
5. Run:

```bash
npm run validate:data
npm test
npm run build
```

## Delete an Event

Open a proposal issue or pull request that removes the event JSON file. Include the reason for removal, such as cancellation, duplicate entry, or stale event data.

## Data Quality Rules

- Use official event websites when possible.
- Keep descriptions concise and factual.
- Do not add private or copyrighted files unless redistribution is allowed.
- Prefer external file links for large files.
- Use repository attachments only when the file is useful to preserve with the event data.
- Add new taxonomy entries only when existing tags do not fit.
