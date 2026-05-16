import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uniqueIndex,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';

/**
 * Schema Drizzle per Desko.
 *
 * Tabelle:
 *  - `user` / `session` / `account` / `verification` — gestite da better-auth
 *    (verranno aggiunte qui dal cli `npx @better-auth/cli generate` durante
 *    `module-add auth`). Convenzione better-auth: tabelle al singolare.
 *  - `presenceEntries` — dichiarazione di presenza (US-1, US-7).
 *  - `weeklyPatterns` — pattern ricorrente settimanale (US-1).
 *  - `follows` — relazioni "segui collega" (US-3).
 *
 * Convenzioni:
 *  - `casing: 'snake_case'` in `db/index.ts` → camelCase in TS, snake_case in SQL.
 *  - `id` text (uuid v4) per allineamento con better-auth users.id (text).
 *  - Timestamps `createdAt` / `updatedAt` non-null con default `now()`.
 *  - Indici espliciti su tutte le colonne usate in WHERE / ORDER BY frequenti.
 */

// ─── Enums ───────────────────────────────────────────────────────────────────

export const presenceStatusEnum = pgEnum('presence_status', [
  'in_office',
  'remote',
  'unspecified',
]);

export const floorEnum = pgEnum('floor', ['seventh_floor', 'second_floor']);

export const visibilityEnum = pgEnum('presence_visibility', [
  'company',
  'team',
  'followers',
  'hidden',
]);

// ─── Pausa pranzo (lunch) ────────────────────────────────────────────────────

export const cuisineEnum = pgEnum('restaurant_cuisine', [
  'italian',
  'pizza',
  'sushi',
  'asian',
  'salad',
  'burger',
  'bistro',
  'bakery',
  'fusion',
  'other',
]);

export const priceRangeEnum = pgEnum('restaurant_price_range', ['€', '€€', '€€€']);

export const proposalVisibilityEnum = pgEnum('lunch_proposal_visibility', [
  'public',
  'private',
]);

export const proposalStatusEnum = pgEnum('lunch_proposal_status', [
  'open',
  'cancelled',
]);

// ─── better-auth core tables (placeholder) ──────────────────────────────────
//
// Le tabelle `user`, `session`, `account`, `verification` saranno generate dal
// cli better-auth durante `module-add auth`. Vengono importate da qui per
// permettere alle altre tabelle di referenziare `user.id` come FK.

export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    // Campi custom Desko:
    role: text('role').notNull().default('user'), // 'user' | 'admin' | 'hr_analytics'
    team: text('team'),
    department: text('department'),
    defaultFloor: floorEnum('default_floor'),
    presenceVisibility: visibilityEnum('presence_visibility')
      .notNull()
      .default('company'),
    // Admin plugin fields:
    banned: boolean('banned').notNull().default(false),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    emailUnique: uniqueIndex('user_email_unique').on(t.email),
    roleIdx: index('user_role_idx').on(t.role),
  }),
);

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    // Admin plugin: impersonate
    impersonatedBy: text('impersonated_by'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    tokenUnique: uniqueIndex('session_token_unique').on(t.token),
    userIdIdx: index('session_user_id_idx').on(t.userId),
  }),
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(), // 'credential' | 'microsoft'
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    providerAccountUnique: uniqueIndex('account_provider_account_unique').on(
      t.providerId,
      t.accountId,
    ),
    userIdIdx: index('account_user_id_idx').on(t.userId),
  }),
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    identifierIdx: index('verification_identifier_idx').on(t.identifier),
  }),
);

// ─── Domain tables — Desko ──────────────────────────────────────────────────

/**
 * Presenza dichiarata per un giorno specifico (US-1, US-7).
 * Una row per (userId, date). Update se ridichiari.
 */
export const presenceEntries = pgTable(
  'presence_entries',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    date: text('date').notNull(), // YYYY-MM-DD (text per semplicità query)
    status: presenceStatusEnum('status').notNull().default('unspecified'),
    floor: floorEnum('floor'), // null = piano non indicato
    note: text('note'),
    isLastMinute: boolean('is_last_minute').notNull().default(false),
    fromPattern: boolean('from_pattern').notNull().default(false),
    lastFloorUpdateAt: timestamp('last_floor_update_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    userDateUnique: uniqueIndex('presence_user_date_unique').on(
      t.userId,
      t.date,
    ),
    dateIdx: index('presence_date_idx').on(t.date),
    floorIdx: index('presence_floor_idx').on(t.floor),
  }),
);

/**
 * Pattern ricorrente settimanale (US-1).
 * Una row per user (lo schema tiene il pattern attivo; storico fuori scope MVP).
 */
export const weeklyPatterns = pgTable(
  'weekly_patterns',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    monday: presenceStatusEnum('monday').notNull().default('unspecified'),
    tuesday: presenceStatusEnum('tuesday').notNull().default('unspecified'),
    wednesday: presenceStatusEnum('wednesday').notNull().default('unspecified'),
    thursday: presenceStatusEnum('thursday').notNull().default('unspecified'),
    friday: presenceStatusEnum('friday').notNull().default('unspecified'),
    defaultFloor: floorEnum('default_floor'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    userUnique: uniqueIndex('weekly_pattern_user_unique').on(t.userId),
  }),
);

/**
 * Follow relations (US-3): chi segue chi.
 */
export const follows = pgTable(
  'follows',
  {
    id: text('id').primaryKey(),
    followerId: text('follower_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    followedId: text('followed_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => ({
    pairUnique: uniqueIndex('follows_pair_unique').on(t.followerId, t.followedId),
    followerIdx: index('follows_follower_idx').on(t.followerId),
    followedIdx: index('follows_followed_idx').on(t.followedId),
  }),
);

/**
 * Ristoranti pre-caricati / aggiunti dagli utenti per la feature pausa pranzo.
 * Curabili da admin, ma chiunque può aggiungerne di nuovi (servonu solo nome
 * e indirizzo). Il rating aggregato è calcolato on-demand da `restaurantRatings`.
 */
export const restaurants = pgTable(
  'restaurants',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    cuisine: cuisineEnum('cuisine').notNull().default('other'),
    priceRange: priceRangeEnum('price_range').notNull().default('€€'),
    address: text('address').notNull(),
    distanceM: integer('distance_m'), // metri dalla sede principale (Gae Aulenti)
    description: text('description'),
    emoji: text('emoji'), // breve "icon" per UI (es. 🍕)
    mapsUrl: text('maps_url'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    isArchived: boolean('is_archived').notNull().default(false),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    nameIdx: index('restaurants_name_idx').on(t.name),
    archivedIdx: index('restaurants_archived_idx').on(t.isArchived),
  }),
);

/**
 * Proposta di pausa pranzo (US-PP). Visibilità:
 *   - 'public': visibile a tutti gli utenti attivi → join libero
 *   - 'private': visibile solo agli invitati (vedi `lunchProposalInvites`) → join solo per loro
 *
 * Vincolo soft: un utente al massimo 1 proposta `open` per data (validato lato server).
 */
export const lunchProposals = pgTable(
  'lunch_proposals',
  {
    id: text('id').primaryKey(),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'restrict' }),
    date: text('date').notNull(), // YYYY-MM-DD
    meetingTime: text('meeting_time').notNull(), // HH:MM (24h)
    maxParticipants: integer('max_participants'), // null = illimitato
    note: text('note'),
    visibility: proposalVisibilityEnum('visibility').notNull().default('public'),
    status: proposalStatusEnum('status').notNull().default('open'),
    cancelledAt: timestamp('cancelled_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    dateIdx: index('lunch_proposals_date_idx').on(t.date),
    creatorDateIdx: index('lunch_proposals_creator_date_idx').on(t.createdBy, t.date),
    statusIdx: index('lunch_proposals_status_idx').on(t.status),
  }),
);

/**
 * Partecipanti a una proposta. Il creator è auto-aggiunto qui alla creazione.
 * Vincolo soft: un utente al massimo 1 partecipazione per (date) — validato lato server.
 */
export const lunchProposalParticipants = pgTable(
  'lunch_proposal_participants',
  {
    proposalId: text('proposal_id')
      .notNull()
      .references(() => lunchProposals.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at').notNull().defaultNow(),
  },
  (t) => ({
    pkPair: uniqueIndex('lunch_participants_pair_pk').on(t.proposalId, t.userId),
    userIdx: index('lunch_participants_user_idx').on(t.userId),
  }),
);

/**
 * Invitati per le proposte private. Solo questi utenti vedono la proposta nella
 * lista "Pausa pranzo". Possono unirsi (entrando in `lunchProposalParticipants`).
 */
export const lunchProposalInvites = pgTable(
  'lunch_proposal_invites',
  {
    proposalId: text('proposal_id')
      .notNull()
      .references(() => lunchProposals.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    invitedAt: timestamp('invited_at').notNull().defaultNow(),
  },
  (t) => ({
    pkPair: uniqueIndex('lunch_invites_pair_pk').on(t.proposalId, t.userId),
    userIdx: index('lunch_invites_user_idx').on(t.userId),
  }),
);

/**
 * Rating dei ristoranti (1-5). Un rating per (utente, ristorante) — l'utente
 * può aggiornare il proprio voto cambiando il valore.
 */
export const restaurantRatings = pgTable(
  'restaurant_ratings',
  {
    restaurantId: text('restaurant_id')
      .notNull()
      .references(() => restaurants.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    score: integer('score').notNull(), // 1..5 (validato lato server)
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    pkPair: uniqueIndex('restaurant_ratings_pair_pk').on(t.restaurantId, t.userId),
    restaurantIdx: index('restaurant_ratings_restaurant_idx').on(t.restaurantId),
  }),
);

// ─── Type exports ────────────────────────────────────────────────────────────

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type PresenceEntry = typeof presenceEntries.$inferSelect;
export type NewPresenceEntry = typeof presenceEntries.$inferInsert;
export type WeeklyPattern = typeof weeklyPatterns.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type Restaurant = typeof restaurants.$inferSelect;
export type NewRestaurant = typeof restaurants.$inferInsert;
export type LunchProposal = typeof lunchProposals.$inferSelect;
export type NewLunchProposal = typeof lunchProposals.$inferInsert;
export type LunchProposalParticipant = typeof lunchProposalParticipants.$inferSelect;
export type LunchProposalInvite = typeof lunchProposalInvites.$inferSelect;
export type RestaurantRating = typeof restaurantRatings.$inferSelect;
