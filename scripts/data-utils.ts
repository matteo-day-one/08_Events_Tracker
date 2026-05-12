import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateEventCollection } from "../src/lib/eventSchema";
import { taxonomy } from "../src/lib/taxonomy";
import type { EventRecord, ValidationResult } from "../src/lib/eventTypes";

export const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const eventDataDirectory = path.join(repositoryRoot, "data", "events");

export async function readEventData(): Promise<EventRecord[]> {
  const fileNames = (await readdir(eventDataDirectory))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b));

  const events = await Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = path.join(eventDataDirectory, fileName);
      const content = await readFile(filePath, "utf8");
      return JSON.parse(content) as EventRecord;
    })
  );

  return events.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.name.localeCompare(b.name));
}

export function validateRepositoryEvents(events: EventRecord[]): ValidationResult {
  return validateEventCollection(events, taxonomy, {
    attachmentExists: (relativePath) => existsSync(path.join(repositoryRoot, relativePath))
  });
}
