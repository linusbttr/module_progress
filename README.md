# Module Progress based on Nuxt.js

### Start

```bash
docker compose up -d --build
```

> Then import the `modules.json` file

### Stop

```bash
docker compose down
```

### Full reset

> Export the `modules.json` via the `Export` Button before doing this.
>
> This deletes all progress

```bash
docker compose down
docker volume rm module_progress_db_data
docker image rm module-progress
```
