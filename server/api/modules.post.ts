import { writeFile } from "node:fs/promises"
import { join } from "node:path"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const storage = useStorage()

  // 1. Update Nitro storage
  await storage.setItem("data:modules.json", body)

  // 2. Persist to file (overwrite)
  const filePath = join(process.cwd(), "public/modules.json")
  await writeFile(filePath, JSON.stringify(body, null, 2), "utf8")

  return { success: true }
})