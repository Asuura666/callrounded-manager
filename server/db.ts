import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  agents,
  InsertAgent,
  calls,
  InsertCall,
  phoneNumbers,
  InsertPhoneNumber,
  knowledgeBases,
  InsertKnowledgeBase,
  knowledgeBaseSources,
  InsertKnowledgeBaseSource,
  events,
  InsertEvent,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Agents
 */
export async function getAgentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(agents).where(eq(agents.userId, userId));
}

export async function getAgentById(agentId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
  return result[0];
}

export async function upsertAgent(agent: InsertAgent) {
  const db = await getDb();
  if (!db) return;
  await db.insert(agents).values(agent).onDuplicateKeyUpdate({
    set: {
      name: agent.name,
      status: agent.status,
      description: agent.description,
      updatedAt: new Date(),
    },
  });
}

/**
 * Appels
 */
export async function getCallsByUserId(userId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(calls).where(eq(calls.userId, userId)).limit(limit).offset(offset);
}

export async function getCallById(callId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(calls).where(eq(calls.id, callId)).limit(1);
  return result[0];
}

export async function upsertCall(call: InsertCall) {
  const db = await getDb();
  if (!db) return;
  await db.insert(calls).values(call).onDuplicateKeyUpdate({
    set: {
      status: call.status,
      transcription: call.transcription,
      recordingUrl: call.recordingUrl,
      duration: call.duration,
      endedAt: call.endedAt,
      updatedAt: new Date(),
    },
  });
}

/**
 * Numéros de téléphone
 */
export async function getPhoneNumbersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(phoneNumbers).where(eq(phoneNumbers.userId, userId));
}

export async function upsertPhoneNumber(phoneNumber: InsertPhoneNumber) {
  const db = await getDb();
  if (!db) return;
  await db.insert(phoneNumbers).values(phoneNumber).onDuplicateKeyUpdate({
    set: {
      status: phoneNumber.status,
      agentId: phoneNumber.agentId,
      updatedAt: new Date(),
    },
  });
}

/**
 * Bases de connaissances
 */
export async function getKnowledgeBasesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeBases).where(eq(knowledgeBases.userId, userId));
}

export async function getKnowledgeBaseById(kbId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(knowledgeBases).where(eq(knowledgeBases.id, kbId)).limit(1);
  return result[0];
}

export async function upsertKnowledgeBase(kb: InsertKnowledgeBase) {
  const db = await getDb();
  if (!db) return;
  await db.insert(knowledgeBases).values(kb).onDuplicateKeyUpdate({
    set: {
      name: kb.name,
      description: kb.description,
      sourceCount: kb.sourceCount,
      updatedAt: new Date(),
    },
  });
}

/**
 * Sources de bases de connaissances
 */
export async function getSourcesByKnowledgeBaseId(kbId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(knowledgeBaseSources).where(eq(knowledgeBaseSources.knowledgeBaseId, kbId));
}

export async function upsertKnowledgeBaseSource(source: InsertKnowledgeBaseSource) {
  const db = await getDb();
  if (!db) return;
  await db.insert(knowledgeBaseSources).values(source).onDuplicateKeyUpdate({
    set: {
      status: source.status,
      updatedAt: new Date(),
    },
  });
}

export async function deleteKnowledgeBaseSource(sourceId: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(knowledgeBaseSources).where(eq(knowledgeBaseSources.id, sourceId));
}

/**
 * Événements
 */
export async function createEvent(event: InsertEvent) {
  const db = await getDb();
  if (!db) return;
  await db.insert(events).values(event);
}

export async function getUnnotifiedEvents(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(events)
    .where(and(eq(events.userId, userId), eq(events.isNotified, 0)));
}

export async function markEventAsNotified(eventId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(events)
    .set({ isNotified: 1 })
    .where(eq(events.id, eventId));
}
