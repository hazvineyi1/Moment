import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { eventsTable } from "./events";

export const planningSessionsTable = pgTable("planning_sessions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  focus: text("focus"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertPlanningSessionSchema = createInsertSchema(planningSessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlanningSession = z.infer<typeof insertPlanningSessionSchema>;
export type PlanningSession = typeof planningSessionsTable.$inferSelect;
