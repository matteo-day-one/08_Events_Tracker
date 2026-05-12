# Public Event Tracker

A static, GitHub-reviewed event tracker for public technical and research events. The app is designed for GitHub Pages: event data lives in repository files, users browse and search the generated index, and public changes are proposed through GitHub issues and pull requests.

## Features

- Searchable and sortable event table.
- Filters for topic, subtopic, mode, fee, start date, and application deadline.
- Event detail panel with websites, external file links, and reviewed repository-hosted attachments.
- Add, update, and delete proposal forms that generate structured GitHub issue content.
- Data validation for schema shape, duplicate ids, dates, URLs, controlled taxonomy tags, and repository attachment paths.
- GitHub Actions for validation, tests, build, and GitHub Pages deployment.

## Local Development

```bash
npm install
npm run generate:index
npm run dev
```

Run checks:

```bash
npm run validate:data
npm test
npm run build
npm run e2e
```

`npm run generate:index` creates `src/generated/eventIndex.ts` from the files in `data/events/`.

## Repository URL

The app uses `VITE_REPOSITORY_URL` to build proposal issue links. The GitHub Pages workflow sets it automatically from the repository running the workflow. For local development, the app falls back to:

```text
https://github.com/your-user/public-event-tracker
```

Override it locally when needed:

```bash
VITE_REPOSITORY_URL=https://github.com/<owner>/<repo> npm run dev
```

## Event Data

Each event is stored as one JSON file in `data/events/<event-id>.json`. Event ids use:

```text
YYYY-lowercase-slug
```

Required fields:

- `id`
- `name`
- `description`
- `website`
- `location`
- `mode`: `in-person`, `online`, or `hybrid`
- `startDate`
- `fee`
- `macrotopics`
- `subtopics`
- `attachments`
- `createdAt`
- `updatedAt`

Optional fields:

- `endDate`
- `applicationDeadline`

Dates use `YYYY-MM-DD`. Timestamps use ISO UTC format ending in `Z`.

## Taxonomy

Controlled macrotopics and subtopics are stored in `data/taxonomy.json`. Add new topic ids through pull requests so maintainers can keep search and filters clean.

## Attachments

Events can include:

- External links with `type: "external"` and a valid `url`.
- Repository-hosted files with `type: "repository"` and a path under `data/attachments/<event-id>/<file-name>`.

Repository attachments should stay small, relevant, and reviewed through pull requests.

## Deployment

1. Push the repository to GitHub.
2. In repository settings, enable Pages and select GitHub Actions as the source.
3. Push to `main`.

The Pages workflow validates data, generates the index, builds the app, and publishes `dist/`.
