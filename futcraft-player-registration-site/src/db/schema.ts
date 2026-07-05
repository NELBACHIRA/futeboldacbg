import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["admin", "coach"]);
export const fieldPositionEnum = pgEnum("field_position", ["Goleiro", "Zagueiro", "Meio-Campo", "Atacante"]);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameUniqueIdx: uniqueIndex("teams_name_unique_idx").on(table.name),
  }),
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    usernameUniqueIdx: uniqueIndex("users_username_unique_idx").on(table.username),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    token: text("token").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tokenUniqueIdx: uniqueIndex("sessions_token_unique_idx").on(table.token),
  }),
);

export const players = pgTable("players", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  nickMinecraft: text("nick_minecraft").notNull(),
  discordTag: text("discord_tag").notNull(),
  posicao: fieldPositionEnum("posicao").notNull(),
  nacionalidade: text("nacionalidade").notNull(),
  fotoCabecaDataUrl: text("foto_cabeca_data_url").notNull(),
  teamId: uuid("team_id")
    .notNull()
    .references(() => teams.id, { onDelete: "cascade" }),
  createdByUserId: uuid("created_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const playerRegistrations = pgTable("player_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  nickMinecraft: text("nick_minecraft").notNull(),
  discordTag: text("discord_tag").notNull(),
  posicao: fieldPositionEnum("posicao").notNull(),
  nacionalidade: text("nacionalidade").notNull(),
  fotoCabecaDataUrl: text("foto_cabeca_data_url").notNull(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  users: many(users),
  players: many(players),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  team: one(teams, {
    fields: [users.teamId],
    references: [teams.id],
  }),
  sessions: many(sessions),
  playersCreated: many(players),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const playersRelations = relations(players, ({ one }) => ({
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id],
  }),
  createdByUser: one(users, {
    fields: [players.createdByUserId],
    references: [users.id],
  }),
}));
