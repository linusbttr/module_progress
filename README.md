# Module Progress

Track your school module completions across WEBT, SEW and CMS.

## Requirements

- **Node.js ≥ 22.5** (uses the built-in `node:sqlite` – no native compilation needed)
- npm

## Features

- Per-task checkboxes: **Code**, **Interview**, **Quiz**
- Task auto-completes (greyed out) when all three are checked
- Live grade calculation per subject (semester & year)
- Donut charts showing CORE / ADV progress
- **Export** all data as JSON
- **Import** a previously exported JSON (replaces all data)
- Persistent SQLite database (zero external DB dependencies)

## Development

```bash
npm install
npm run dev        # uses NODE_OPTIONS=--experimental-sqlite on Node 22
                   # Node 24+ needs no flag – it's stable
```

The app seeds the database from `modules.json` on first start.

## Production (Docker)

```bash
# Build & start
docker compose up -d --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

The SQLite database is stored in a named Docker volume (`db_data`).

### Manual backup

```bash
docker compose cp app:/data/progress.db ./progress.db.bak
```

## Why node:sqlite instead of better-sqlite3?

`better-sqlite3` requires native compilation via `node-gyp`. This fails on Node 24
because no prebuilt binaries are available yet. `node:sqlite` ships with Node itself –
zero compilation, zero extra dependencies.

## Project structure

```
.
├── app/
│   ├── app.vue                        ← Root layout, nav, import/export
│   ├── css/global.css
│   ├── pages/
│   │   ├── index.vue                  ← Task checklist
│   │   └── chart.vue                  ← Progress donuts + grade display
│   └── components/
│       └── DonutChart.vue
├── server/
│   ├── api/
│   │   ├── modules.get.ts             ← GET  /api/modules
│   │   ├── export.get.ts              ← GET  /api/export  (JSON-Download)
│   │   ├── import.post.ts             ← POST /api/import
│   │   └── tasks/[module]/[taskId].patch.ts
│   └── utils/db.ts                    ← node:sqlite singleton + seed logic
├── types/index.ts
├── modules.json                       ← Seed data (read once on first start)
├── Dockerfile                         ← Multi-stage, Node 24
└── docker-compose.yml
```
