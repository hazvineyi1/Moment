import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";

export const memoriesTable = pgTable("memories", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  addedAt: timestamp("added_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Memory = typeof memoriesTable.$inferSelect;
