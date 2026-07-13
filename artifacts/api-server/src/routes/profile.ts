import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { GetProfileResponse, UpdateProfileBody, UpdateProfileResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// Ensure a default user profile exists (single-user app for now)
async function getOrCreateUser() {
  const existing = await db.select().from(usersTable).limit(1);
  if (existing.length > 0) return existing[0];
  const [created] = await db.insert(usersTable).values({ name: "Traveler" }).returning();
  return created;
}

router.get("/profile", async (req, res): Promise<void> => {
  const user = await getOrCreateUser();
  res.json(GetProfileResponse.parse({
    id: user.id,
    name: user.name,
    email: user.email ?? null,
    phone: user.phone ?? null,
    location: user.location ?? null,
    bio: user.bio ?? null,
    personality: user.personality ?? null,
    preferences: user.preferences ?? null,
    createdAt: user.createdAt.toISOString(),
  }));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = await getOrCreateUser();
  const data = parsed.data;

  const [updated] = await db
    .update(usersTable)
    .set({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.personality !== undefined && { personality: data.personality }),
      ...(data.preferences !== undefined && { preferences: data.preferences }),
    })
    .where(eq(usersTable.id, user.id))
    .returning();

  res.json(UpdateProfileResponse.parse({
    id: updated.id,
    name: updated.name,
    email: updated.email ?? null,
    phone: updated.phone ?? null,
    location: updated.location ?? null,
    bio: updated.bio ?? null,
    personality: updated.personality ?? null,
    preferences: updated.preferences ?? null,
    createdAt: updated.createdAt.toISOString(),
  }));
});

export default router;
