# Module Progress based on Nuxt.js

### Start

```bash
docker compose up -d --build
```
> The website is now available at [localhost:3000](http://localhost:3000)
> 
> Then import the [modules.json](/modules.json) file via the `Import` Button

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
