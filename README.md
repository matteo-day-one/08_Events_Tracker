# Public Event Tracker

A static, GitHub-reviewed event tracker for public technical and research events. The app is designed for GitHub Pages: event data lives in repository files, users browse and search the generated index, and public changes are proposed through GitHub issues and pull requests.

## Features

- Searchable and sortable event table.
- Multi-select filters for topics, subtopics, region, country, mode, fee, start date, and application deadline.
- Timeline and Google Maps views that share the active filters.
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

## Google Maps

The map view uses Google Maps when `VITE_GOOGLE_MAPS_API_KEY` is configured. Without a key, the app still builds and shows the mappable event list with a clear configuration fallback.

For local development:

```bash
VITE_GOOGLE_MAPS_API_KEY=<browser-key> npm run dev
```

`VITE_GOOGLE_MAPS_MAP_ID` is optional. Leave it unset unless you have created a real Google Maps Platform map ID for this project. For production, restrict the browser API key by HTTP referrer because frontend map keys are visible in deployed JavaScript.

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

## Locations

Reviewed location metadata lives in `data/locations.json`. Each unique event `location` must have a catalog entry with country/region metadata; mappable physical cities also include approximate city-center latitude and longitude. Online and ambiguous multi-city events can remain non-mappable, so they appear in the directory and timeline but are hidden from the map.

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

If the workflow fails in `actions/configure-pages` with `HttpError: Not Found`, GitHub Pages has not been enabled for the repository yet. Open **Settings -> Pages**, set **Build and deployment** to **GitHub Actions**, then rerun the workflow. GitHub's default `GITHUB_TOKEN` can deploy a configured Pages site, but it cannot create the Pages site setting for a new repository.
