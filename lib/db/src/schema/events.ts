import { pgTable, text, serial, timestamp, boolean, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().default(""),
  questionnaireToken: text("questionnaire_token"),
  title: text("title").notNull(),
  type: text("type").notNull().default("other"),
  description: text("description"),
  location: text("location"),
  isInternational: boolean("is_international").notNull().default(false),
  startDate: date("start_date", { mode: "string" }),
  endDate: date("end_date", { mode: "string" }),
  budget: text("budget"),
  guestCount: integer("guest_count"),
  status: text("status").notNull().default("planning"),
  coverImage: text("cover_image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
