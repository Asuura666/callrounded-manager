import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Agents téléphoniques CallRounded
 * Stocke les agents liés au compte client
 */
export const agents = mysqlTable("agents", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull(),
  name: text("name").notNull(),
  status: mysqlEnum("status", ["active", "inactive", "paused"]).default("inactive").notNull(),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;

/**
 * Appels téléphoniques
 * Stocke l'historique des appels
 */
export const calls = mysqlTable("calls", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull(),
  agentId: varchar("agent_id", { length: 64 }).notNull(),
  externalCallId: varchar("external_call_id", { length: 255 }).notNull(),
  callerNumber: varchar("caller_number", { length: 20 }),
  duration: int("duration"), // en secondes
  status: mysqlEnum("status", ["completed", "failed", "missed", "ongoing"]).notNull(),
  transcription: text("transcription"),
  recordingUrl: text("recording_url"),
  startedAt: timestamp("started_at"),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type Call = typeof calls.$inferSelect;
export type InsertCall = typeof calls.$inferInsert;

/**
 * Numéros de téléphone
 * Stocke les numéros associés aux agents
 */
export const phoneNumbers = mysqlTable("phone_numbers", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull(),
  agentId: varchar("agent_id", { length: 64 }),
  externalPhoneNumberId: varchar("external_phone_number_id", { length: 255 }).notNull(),
  number: varchar("number", { length: 20 }).notNull(),
  status: mysqlEnum("status", ["active", "inactive"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type PhoneNumber = typeof phoneNumbers.$inferSelect;
export type InsertPhoneNumber = typeof phoneNumbers.$inferInsert;

/**
 * Bases de connaissances
 * Stocke les bases de connaissances des agents
 */
export const knowledgeBases = mysqlTable("knowledge_bases", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull(),
  agentId: varchar("agent_id", { length: 64 }),
  externalKnowledgeBaseId: varchar("external_knowledge_base_id", { length: 255 }).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  sourceCount: int("source_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type InsertKnowledgeBase = typeof knowledgeBases.$inferInsert;

/**
 * Sources de bases de connaissances
 * Stocke les sources (fichiers, URLs) dans les bases de connaissances
 */
export const knowledgeBaseSources = mysqlTable("knowledge_base_sources", {
  id: varchar("id", { length: 64 }).primaryKey(),
  knowledgeBaseId: varchar("knowledge_base_id", { length: 64 }).notNull(),
  externalSourceId: varchar("external_source_id", { length: 255 }).notNull(),
  fileName: text("file_name"),
  fileUrl: text("file_url"),
  type: mysqlEnum("type", ["file", "url", "text"]).notNull(),
  status: mysqlEnum("status", ["ingesting", "ready", "failed"]).default("ingesting").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type KnowledgeBaseSource = typeof knowledgeBaseSources.$inferSelect;
export type InsertKnowledgeBaseSource = typeof knowledgeBaseSources.$inferInsert;

/**
 * Événements et notifications
 * Stocke les événements pour les notifications
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  type: mysqlEnum("type", ["call_missed", "agent_error", "agent_offline", "call_completed", "system_alert"]).notNull(),
  title: text("title").notNull(),
  message: text("message"),
  relatedAgentId: varchar("related_agent_id", { length: 64 }),
  relatedCallId: varchar("related_call_id", { length: 64 }),
  isNotified: int("is_notified").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;