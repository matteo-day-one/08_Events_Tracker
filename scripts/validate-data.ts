import { readEventData, validateRepositoryEvents } from "./data-utils";

const events = await readEventData();
const result = validateRepositoryEvents(events);

if (!result.ok) {
  console.error("Event data validation failed:");
  for (const error of result.errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${events.length} events.`);
