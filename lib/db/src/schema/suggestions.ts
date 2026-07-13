import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { eventsTable } from "./events";

export const suggestionsTable = pgTable("suggestions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("venue"),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  country: text("country"),
  estimatedCost: text("estimated_cost"),
  bestFor: text("best_for"),
  highlights: text("highlights"),
  isSaved: boolean("is_saved").notNull().default(false),
  imageUrl: text("image_url"),
  websiteUrl: text("website_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSuggestionSchema = createInsertSchema(suggestionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSuggestion = z.infer<typeof insertSuggestionSchema>;
export type Suggestion = typeof suggestionsTable.$inferSelect;
