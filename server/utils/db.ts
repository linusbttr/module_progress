// Uses the built-in node:sqlite module (Node >=22.5 experimental, Node 24+ stable).
// No native compilation required – no more prebuild-install headaches.
import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'

let _db: DatabaseSync | null = null

export function getDb(): DatabaseSync {
  if (_db) return _db

  const dataDir = process.env.DATA_DIR ?? join(process.cwd(), 'data')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  _db = new DatabaseSync(join(dataDir, 'progress.db'))

  _db.exec(`PRAGMA journal_mode = WAL`)
  _db.exec(`PRAGMA foreign_keys = ON`)

  _db.exec(`
    CREATE TABLE IF NOT EXISTS modules (
      name                  TEXT    PRIMARY KEY,
      coreRequiredSemester  INTEGER NOT NULL,
      coreRequiredYear      INTEGER NOT NULL,
      advRequiredSemester   INTEGER NOT NULL,
      advRequiredYear       INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER NOT NULL,
      module_name TEXT    NOT NULL REFERENCES modules(name) ON DELETE CASCADE,
      type        TEXT    NOT NULL,
      number      TEXT    NOT NULL DEFAULT '',
      title       TEXT    NOT NULL,
      code        INTEGER NOT NULL DEFAULT 0,
      interview   INTEGER NOT NULL DEFAULT 0,
      quiz        INTEGER NOT NULL DEFAULT 0,
      completed   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (id, module_name)
    );
  `)

  // Seed once if the DB is empty
  const row = _db.prepare('SELECT COUNT(*) AS c FROM modules').get() as { c: number }
  if (row.c === 0) {
    const seedPath = join(process.cwd(), 'modules.json')
    if (existsSync(seedPath)) {
      const seed = JSON.parse(readFileSync(seedPath, 'utf-8'))
      importData(_db, seed)
      console.log('[db] Database seeded from modules.json')
    }
  }

  return _db
}

interface SeedTask {
  id: number
  type: string
  number?: string
  title: string
  code?: boolean
  interview?: boolean
  quiz?: boolean
  completed?: boolean
}

interface SeedModule {
  name: string
  coreRequiredSemester: number
  coreRequiredYear: number
  advRequiredSemester: number
  advRequiredYear: number
  tasks: SeedTask[]
}

export function importData(db: DatabaseSync, data: SeedModule[]): void {
  const insertModule = db.prepare(`
    INSERT INTO modules (name, coreRequiredSemester, coreRequiredYear, advRequiredSemester, advRequiredYear)
    VALUES (?, ?, ?, ?, ?)
  `)
  const insertTask = db.prepare(`
    INSERT INTO tasks (id, module_name, type, number, title, code, interview, quiz, completed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  // node:sqlite has no .transaction() helper - use manual BEGIN/COMMIT
  db.exec('BEGIN')
  try {
    db.exec('DELETE FROM tasks')
    db.exec('DELETE FROM modules')

    for (const m of data) {
      insertModule.run(
        m.name,
        m.coreRequiredSemester,
        m.coreRequiredYear,
        m.advRequiredSemester,
        m.advRequiredYear,
      )
      for (const t of m.tasks) {
        insertTask.run(
          t.id,
          m.name,
          t.type,
          t.number ?? '',
          t.title,
          t.code ? 1 : 0,
          t.interview ? 1 : 0,
          t.quiz ? 1 : 0,
          t.completed ? 1 : 0,
        )
      }
    }

    db.exec('COMMIT')
  } catch (err) {
    db.exec('ROLLBACK')
    throw err
  }
}
