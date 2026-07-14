import { eq, and } from "drizzle-orm";
import { db, eventsTable } from "@workspace/db";

type EventRow = typeof eventsTable.$inferSelect;

/**
 * Fetch an event that belongs to the given Clerk user.
 * Returns null if not found or if the user doesn't own it.
 */
export async function fetchOwnedEvent(userId: string, eventId: number): Promise<EventRow | null> {
  const [event] = await db
    .select()
    .from(eventsTable)
    .where(and(eq(eventsTable.id, eventId), eq(eventsTable.clerkUserId, userId)));
  return event ?? null;
}
