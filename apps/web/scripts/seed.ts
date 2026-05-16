/**
 * Seed iniziale: super-admin + utenti di test.
 *
 * Eseguire con:
 *   pnpm --filter @desko/web run db:seed
 *
 * Idempotente: se l'utente esiste già, aggiorna solo i campi di profilo.
 *
 * Driver: `@neondatabase/serverless` Pool con WebSocket (stesso di migrate.ts).
 *
 * Tutti gli utenti di test condividono la stessa password (Demo@123) — 8 caratteri
 * con simbolo + cifre per rispettare la policy `minPasswordLength: 8` di better-auth.
 * Da NON usare in produzione: questi account sono solo per test locali.
 */

// Carica .env.local PRIMA di importare moduli che leggono process.env.
// In ESM gli import sono hoisted: serve un dynamic import dopo config().
import { config } from 'dotenv';
import { existsSync } from 'node:fs';

if (existsSync('.env.local')) config({ path: '.env.local' });
config();

const { neonConfig, Pool } = await import('@neondatabase/serverless');
const { and, eq, inArray } = await import('drizzle-orm');
const { drizzle } = await import('drizzle-orm/neon-serverless');
const ws = (await import('ws')).default;
const { randomUUID } = await import('node:crypto');

const { auth } = await import('../lib/auth');
const schema = await import('../lib/db/schema');

neonConfig.webSocketConstructor = ws;

const COMMON_PASSWORD = 'Demo@123';

type SeedUser = {
  email: string;
  name: string;
  role: 'admin' | 'hr_analytics' | 'user';
  team: string | null;
  department: string | null;
  emailVerified?: boolean;
  banned?: boolean;
  banReason?: string;
};

const USERS: SeedUser[] = [
  {
    email: 'admin@desko.local',
    name: 'Super Admin',
    role: 'admin',
    team: 'Operations',
    department: 'IT',
    emailVerified: true,
  },
  {
    email: 'hr@desko.local',
    name: 'Giorgia Ferrari',
    role: 'hr_analytics',
    team: 'People',
    department: 'HR',
    emailVerified: true,
  },
  {
    email: 'mario.rossi@desko.local',
    name: 'Mario Rossi',
    role: 'user',
    team: 'Backend',
    department: 'Engineering',
    emailVerified: true,
  },
  {
    email: 'lucia.bianchi@desko.local',
    name: 'Lucia Bianchi',
    role: 'user',
    team: 'Product Design',
    department: 'Design',
    emailVerified: true,
  },
  {
    email: 'paolo.verdi@desko.local',
    name: 'Paolo Verdi',
    role: 'user',
    team: 'Brand',
    department: 'Marketing',
    emailVerified: true,
  },
  {
    email: 'anna.neri@desko.local',
    name: 'Anna Neri',
    role: 'user',
    team: 'Account',
    department: 'Sales',
    emailVerified: true,
  },
  {
    email: 'marco.gallo@desko.local',
    name: 'Marco Gallo',
    role: 'user',
    team: 'Frontend',
    department: 'Engineering',
    emailVerified: true,
  },
  {
    email: 'sara.romano@desko.local',
    name: 'Sara Romano',
    role: 'user',
    team: 'Operations',
    department: 'Operations',
    emailVerified: true,
  },
  {
    email: 'davide.conti@desko.local',
    name: 'Davide Conti',
    role: 'user',
    team: 'Brand',
    department: 'Design',
    emailVerified: true,
  },
  {
    email: 'giulia.mancini@desko.local',
    name: 'Giulia Mancini',
    role: 'user',
    team: 'Growth',
    department: 'Marketing',
    emailVerified: true,
  },
  {
    email: 'simone.lombardi@desko.local',
    name: 'Simone Lombardi',
    role: 'user',
    team: 'Platform',
    department: 'Engineering',
    emailVerified: true,
  },
  // Stato edge: utente bannato (per testare il chip "Bannato" nella tabella admin).
  {
    email: 'luca.ferrari@desko.local',
    name: 'Luca Ferrari',
    role: 'user',
    team: 'Backend',
    department: 'Engineering',
    emailVerified: true,
    banned: true,
    banReason: 'Account compromesso (seed test)',
  },
  // Stato edge: email non verificata (per testare il chip "Email non verificata").
  {
    email: 'elena.greco@desko.local',
    name: 'Elena Greco',
    role: 'user',
    team: 'People',
    department: 'HR',
    emailVerified: false,
  },
];

const url = process.env.DATABASE_URL;
if (!url || url.includes('placeholder')) {
  console.error('❌ DATABASE_URL non configurata.');
  process.exit(1);
}

async function seed() {
  const pool = new Pool({ connectionString: url });
  const db = drizzle({ client: pool, schema, casing: 'snake_case' });

  console.log('🌱 Seed Desko — utenti di test');
  console.log('─'.repeat(60));

  let created = 0;
  let updated = 0;

  for (const u of USERS) {
    // 1. Crea l'account via better-auth (password hashata correttamente) se non esiste.
    const existing = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.email, u.email))
      .limit(1);

    let userId: string;

    if (existing.length > 0 && existing[0]) {
      userId = existing[0].id;
      updated += 1;
    } else {
      const result = await auth.api.signUpEmail({
        body: { email: u.email, password: COMMON_PASSWORD, name: u.name },
      });
      if (!result.user) {
        throw new Error(`Creazione utente fallita: ${u.email}`);
      }
      userId = result.user.id;
      created += 1;
    }

    // 2. Allinea i campi di profilo + ruolo + ban (signUpEmail non li imposta).
    const banExpires =
      u.banned ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) : null;

    await db
      .update(schema.user)
      .set({
        name: u.name,
        role: u.role,
        team: u.team,
        department: u.department,
        emailVerified: u.emailVerified ?? true,
        banned: u.banned ?? false,
        banReason: u.banReason ?? null,
        banExpires,
        updatedAt: new Date(),
      })
      .where(eq(schema.user.id, userId));

    const tags: string[] = [u.role];
    if (u.banned) tags.push('banned');
    if (u.emailVerified === false) tags.push('email-unverified');

    console.log(
      `  ${existing.length > 0 ? '↻' : '+'} ${u.name.padEnd(22)} ${u.email.padEnd(36)} [${tags.join(', ')}]`,
    );
  }

  // ─── Step 2: presence_entries (ultimi 30 giorni × utenti attivi) ──────────
  console.log('');
  console.log('🌱 Step 2 — presence_entries (ultimi 30 giorni feriali)');
  console.log('─'.repeat(60));

  // Solo utenti attivi (non bannati). Recupera id+email per logging.
  const activeUsers = await db
    .select({
      id: schema.user.id,
      email: schema.user.email,
      name: schema.user.name,
    })
    .from(schema.user)
    .where(eq(schema.user.banned, false));

  // Mapping email → user record (per accedere via email senza altre query)
  const userByEmail = new Map(activeUsers.map((u) => [u.email, u]));

  // Genera 30 giorni feriali passati + 10 futuri (così /calendar ha dati anche
  // sul "team overlap del prossimo giorno migliore").
  const businessDays: { date: string; dow: number }[] = [];
  {
    const today = new Date();
    // 30 giorni passati (a ritroso, escludendo oggi)
    {
      let cursor = new Date(today);
      cursor.setDate(cursor.getDate() - 1);
      const past: { date: string; dow: number }[] = [];
      while (past.length < 30) {
        const dow = cursor.getDay();
        if (dow >= 1 && dow <= 5) {
          const date = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
          past.unshift({ date, dow });
        }
        cursor.setDate(cursor.getDate() - 1);
      }
      businessDays.push(...past);
    }
    // 10 giorni futuri (oggi se feriale + a venire)
    {
      let cursor = new Date(today);
      const future: { date: string; dow: number }[] = [];
      while (future.length < 10) {
        const dow = cursor.getDay();
        if (dow >= 1 && dow <= 5) {
          const date = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-${String(cursor.getDate()).padStart(2, '0')}`;
          future.push({ date, dow });
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      businessDays.push(...future);
    }
  }

  // PRNG deterministico (mulberry32) seedato con hash di (userId+date) →
  // re-runnando lo seed otteniamo SEMPRE le stesse decisioni.
  function hashStringToInt(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function mulberry32(seed: number) {
    let t = seed;
    return () => {
      t |= 0;
      t = (t + 0x6d2b79f5) | 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Probabilità in_office / remote / unspecified per giorno della settimana.
  // Mar/Mer/Gio: ufficio pieno. Lun: misto. Ven: smart-day.
  const DOW_PROFILE: Record<number, { inOffice: number; remote: number }> = {
    1: { inOffice: 0.5, remote: 0.3 }, // Lun
    2: { inOffice: 0.7, remote: 0.2 }, // Mar
    3: { inOffice: 0.75, remote: 0.18 }, // Mer
    4: { inOffice: 0.7, remote: 0.22 }, // Gio
    5: { inOffice: 0.35, remote: 0.5 }, // Ven
  };

  // Carico le coppie (userId, date) già presenti per skippare in fase di insert.
  const existingPairsRows = await db
    .select({
      userId: schema.presenceEntries.userId,
      date: schema.presenceEntries.date,
    })
    .from(schema.presenceEntries)
    .where(
      inArray(
        schema.presenceEntries.date,
        businessDays.map((d) => d.date),
      ),
    );
  const existingPairs = new Set(existingPairsRows.map((r) => `${r.userId}|${r.date}`));

  type NewPresence = typeof schema.presenceEntries.$inferInsert;
  const rows: NewPresence[] = [];

  for (const u of activeUsers) {
    for (const day of businessDays) {
      if (existingPairs.has(`${u.id}|${day.date}`)) continue;

      const rng = mulberry32(hashStringToInt(`${u.id}|${day.date}`));
      const r = rng();
      const profile = DOW_PROFILE[day.dow]!;

      let status: 'in_office' | 'remote' | 'unspecified';
      let floor: 'seventh_floor' | 'second_floor' | null;

      if (r < profile.inOffice) {
        status = 'in_office';
        floor = rng() < 0.6 ? 'seventh_floor' : 'second_floor';
      } else if (r < profile.inOffice + profile.remote) {
        status = 'remote';
        floor = null;
      } else {
        continue; // unspecified — saltiamo del tutto la riga
      }

      const isLastMinute = rng() < 0.08;
      rows.push({
        id: randomUUID(),
        userId: u.id,
        date: day.date,
        status,
        floor,
        note: null,
        isLastMinute,
        fromPattern: false,
        lastFloorUpdateAt: status === 'in_office' ? new Date() : null,
      });
    }
  }

  if (rows.length > 0) {
    await db.insert(schema.presenceEntries).values(rows);
  }
  console.log(
    `  + ${rows.length} presence_entries inserite (di ${activeUsers.length} utenti × ${businessDays.length} giorni). Esistenti: ${existingPairs.size}.`,
  );

  // ─── Step 3: weekly_patterns (per metà degli utenti) ──────────────────────
  console.log('');
  console.log('🌱 Step 3 — weekly_patterns');
  console.log('─'.repeat(60));

  type DayStatus = 'in_office' | 'remote' | 'unspecified';
  const PATTERN_PRESETS: Array<{
    email: string;
    pattern: [DayStatus, DayStatus, DayStatus, DayStatus, DayStatus];
    defaultFloor: 'seventh_floor' | 'second_floor' | null;
  }> = [
    {
      email: 'mario.rossi@desko.local',
      pattern: ['in_office', 'in_office', 'in_office', 'remote', 'remote'],
      defaultFloor: 'seventh_floor',
    },
    {
      email: 'lucia.bianchi@desko.local',
      pattern: ['remote', 'in_office', 'in_office', 'in_office', 'remote'],
      defaultFloor: 'second_floor',
    },
    {
      email: 'paolo.verdi@desko.local',
      pattern: ['in_office', 'remote', 'in_office', 'remote', 'in_office'],
      defaultFloor: 'seventh_floor',
    },
    {
      email: 'anna.neri@desko.local',
      pattern: ['in_office', 'in_office', 'remote', 'in_office', 'in_office'],
      defaultFloor: 'second_floor',
    },
    {
      email: 'sara.romano@desko.local',
      pattern: ['in_office', 'in_office', 'in_office', 'in_office', 'remote'],
      defaultFloor: 'seventh_floor',
    },
    {
      email: 'simone.lombardi@desko.local',
      pattern: ['remote', 'in_office', 'in_office', 'remote', 'remote'],
      defaultFloor: 'seventh_floor',
    },
  ];

  let patternsCreated = 0;
  let patternsUpdated = 0;
  for (const preset of PATTERN_PRESETS) {
    const u = userByEmail.get(preset.email);
    if (!u) continue;

    const existing = await db
      .select()
      .from(schema.weeklyPatterns)
      .where(eq(schema.weeklyPatterns.userId, u.id))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.weeklyPatterns)
        .set({
          monday: preset.pattern[0],
          tuesday: preset.pattern[1],
          wednesday: preset.pattern[2],
          thursday: preset.pattern[3],
          friday: preset.pattern[4],
          defaultFloor: preset.defaultFloor,
          updatedAt: new Date(),
        })
        .where(eq(schema.weeklyPatterns.userId, u.id));
      patternsUpdated += 1;
    } else {
      await db.insert(schema.weeklyPatterns).values({
        id: randomUUID(),
        userId: u.id,
        monday: preset.pattern[0],
        tuesday: preset.pattern[1],
        wednesday: preset.pattern[2],
        thursday: preset.pattern[3],
        friday: preset.pattern[4],
        defaultFloor: preset.defaultFloor,
      });
      patternsCreated += 1;
    }
    console.log(
      `  ${existing.length > 0 ? '↻' : '+'} ${u.name.padEnd(22)} ${preset.pattern.join(' / ')}`,
    );
  }

  // ─── Step 4: follows (relazioni "segui collega") ──────────────────────────
  console.log('');
  console.log('🌱 Step 4 — follows');
  console.log('─'.repeat(60));

  // 20 archi deterministici tra utenti attivi (no admin/hr_analytics, no self).
  const followCandidates = activeUsers.filter(
    (u) => !u.email.startsWith('admin@') && !u.email.startsWith('hr@'),
  );
  const followPairs: Array<{ followerId: string; followedId: string }> = [];
  const targetCount = 20;
  const rng = mulberry32(hashStringToInt('desko-follows-v1'));
  let safety = 0;
  while (followPairs.length < targetCount && safety < 200) {
    safety += 1;
    const a = followCandidates[Math.floor(rng() * followCandidates.length)]!;
    const b = followCandidates[Math.floor(rng() * followCandidates.length)]!;
    if (a.id === b.id) continue;
    if (followPairs.some((p) => p.followerId === a.id && p.followedId === b.id)) continue;
    followPairs.push({ followerId: a.id, followedId: b.id });
  }

  let followsCreated = 0;
  for (const pair of followPairs) {
    const existing = await db
      .select({ id: schema.follows.id })
      .from(schema.follows)
      .where(
        and(
          eq(schema.follows.followerId, pair.followerId),
          eq(schema.follows.followedId, pair.followedId),
        ),
      )
      .limit(1);
    if (existing.length > 0) continue;

    await db.insert(schema.follows).values({
      id: randomUUID(),
      followerId: pair.followerId,
      followedId: pair.followedId,
    });
    followsCreated += 1;
  }
  console.log(`  + ${followsCreated} follows creati (${followPairs.length} totali, gli altri già presenti)`);

  // ─── Step 5: ristoranti zona Gae Aulenti (Milano) ─────────────────────────
  console.log('');
  console.log('🌱 Step 5 — ristoranti zona Gae Aulenti');
  console.log('─'.repeat(60));

  type Cuisine =
    | 'italian'
    | 'pizza'
    | 'sushi'
    | 'asian'
    | 'salad'
    | 'burger'
    | 'bistro'
    | 'bakery'
    | 'fusion'
    | 'other';
  type PriceRange = '€' | '€€' | '€€€';

  const RESTAURANTS: Array<{
    slug: string; // chiave logica per idempotency
    name: string;
    cuisine: Cuisine;
    priceRange: PriceRange;
    address: string;
    distanceM: number;
    description: string;
    emoji: string;
    mapsUrl: string;
  }> = [
    {
      slug: 'berbere-isola',
      name: 'Berberè Isola',
      cuisine: 'pizza',
      priceRange: '€€',
      address: 'Via Sebenico 21, Milano',
      distanceM: 250,
      description: 'Pizza artigianale con farine biologiche e impasti a lievitazione naturale.',
      emoji: '🍕',
      mapsUrl: 'https://maps.google.com/?q=Berber%C3%A8+Isola+Milano',
    },
    {
      slug: 'bento-isola',
      name: 'Bento',
      cuisine: 'sushi',
      priceRange: '€€',
      address: 'Via Pollaiuolo 5, Milano',
      distanceM: 400,
      description: 'Sushi e bowl giapponesi in un locale minimal vicino alla stazione.',
      emoji: '🍣',
      mapsUrl: 'https://maps.google.com/?q=Bento+Milano+Pollaiuolo',
    },
    {
      slug: 'princi-stazione',
      name: 'Princi Centrale',
      cuisine: 'bakery',
      priceRange: '€',
      address: 'Stazione Centrale, Milano',
      distanceM: 150,
      description: 'Panini, pizzette e focacce artigianali — pausa pranzo veloce e sostanziosa.',
      emoji: '🥪',
      mapsUrl: 'https://maps.google.com/?q=Princi+Stazione+Centrale',
    },
    {
      slug: 'thats-vapore',
      name: "That's Vapore",
      cuisine: 'asian',
      priceRange: '€',
      address: 'Via Borsieri 7, Milano',
      distanceM: 300,
      description: 'Ravioli al vapore e zuppe asiatiche — fast e leggero.',
      emoji: '🥟',
      mapsUrl: "https://maps.google.com/?q=That's+Vapore+Borsieri",
    },
    {
      slug: 'pave-break',
      name: 'Pavé Break',
      cuisine: 'bistro',
      priceRange: '€',
      address: 'Via Felice Casati 27, Milano',
      distanceM: 500,
      description: 'Bistrot e pasticceria — insalate, primi del giorno e dolci di alta qualità.',
      emoji: '🥗',
      mapsUrl: 'https://maps.google.com/?q=Pav%C3%A9+Break+Milano',
    },
    {
      slug: 'eataly-smeraldo',
      name: 'Eataly Milano Smeraldo',
      cuisine: 'italian',
      priceRange: '€€',
      address: 'Piazza XXV Aprile 10, Milano',
      distanceM: 600,
      description: 'Cucina italiana multi-corner — pasta, pesce, pizza, birre artigianali.',
      emoji: '🇮🇹',
      mapsUrl: 'https://maps.google.com/?q=Eataly+Smeraldo+Milano',
    },
    {
      slug: 'ratana',
      name: 'Ratanà',
      cuisine: 'italian',
      priceRange: '€€€',
      address: 'Via Gaetano de Castillia 28, Milano',
      distanceM: 350,
      description: 'Cucina lombarda contemporanea — opzione raffinata per occasioni speciali.',
      emoji: '🍝',
      mapsUrl: 'https://maps.google.com/?q=Ratan%C3%A0+Milano',
    },
    {
      slug: 'spica',
      name: 'Spica',
      cuisine: 'fusion',
      priceRange: '€€€',
      address: 'Via Melzo 9, Milano',
      distanceM: 400,
      description: 'Cucina moderna fusion — piatti creativi e tasting menu degustazione.',
      emoji: '✨',
      mapsUrl: 'https://maps.google.com/?q=Spica+Milano',
    },
  ];

  let restaurantsCreated = 0;
  let restaurantsUpdated = 0;
  // Mappa slug → restaurant ID (riusato per proposte demo + ratings)
  const restaurantBySlug = new Map<string, string>();

  for (const r of RESTAURANTS) {
    const existing = await db
      .select()
      .from(schema.restaurants)
      .where(
        and(
          eq(schema.restaurants.name, r.name),
          eq(schema.restaurants.address, r.address),
        ),
      )
      .limit(1);

    if (existing.length > 0 && existing[0]) {
      restaurantBySlug.set(r.slug, existing[0].id);
      // Aggiorna campi di profilo (idempotent re-run aggiorna emoji/desc se cambia)
      await db
        .update(schema.restaurants)
        .set({
          cuisine: r.cuisine,
          priceRange: r.priceRange,
          distanceM: r.distanceM,
          description: r.description,
          emoji: r.emoji,
          mapsUrl: r.mapsUrl,
          updatedAt: new Date(),
        })
        .where(eq(schema.restaurants.id, existing[0].id));
      restaurantsUpdated += 1;
    } else {
      const id = randomUUID();
      await db.insert(schema.restaurants).values({
        id,
        name: r.name,
        cuisine: r.cuisine,
        priceRange: r.priceRange,
        address: r.address,
        distanceM: r.distanceM,
        description: r.description,
        emoji: r.emoji,
        mapsUrl: r.mapsUrl,
        createdBy: null, // pre-caricato dal sistema
      });
      restaurantBySlug.set(r.slug, id);
      restaurantsCreated += 1;
    }
    console.log(
      `  ${existing.length > 0 ? '↻' : '+'} ${r.emoji} ${r.name.padEnd(28)} ${r.cuisine.padEnd(8)} ${r.priceRange.padEnd(4)} ~${r.distanceM}m`,
    );
  }

  // ─── Step 6: rating ristoranti (alcuni utenti votano alcuni ristoranti) ──
  console.log('');
  console.log('🌱 Step 6 — restaurant_ratings');
  console.log('─'.repeat(60));

  // Ognuno dei primi 6 utenti vota 4 ristoranti random — set deterministico
  const ratingRng = mulberry32(hashStringToInt('desko-ratings-v1'));
  const ratingCandidates = activeUsers.slice(0, 6);
  const restaurantIds = Array.from(restaurantBySlug.values());
  let ratingsCreated = 0;
  for (const u of ratingCandidates) {
    // Shuffle deterministico
    const shuffled = [...restaurantIds].sort(() => ratingRng() - 0.5);
    const picks = shuffled.slice(0, 4);
    for (const restId of picks) {
      const score = 3 + Math.floor(ratingRng() * 3); // 3..5 (rating positivo realistic)
      const existingRating = await db
        .select()
        .from(schema.restaurantRatings)
        .where(
          and(
            eq(schema.restaurantRatings.restaurantId, restId),
            eq(schema.restaurantRatings.userId, u.id),
          ),
        )
        .limit(1);
      if (existingRating.length > 0) continue;
      await db.insert(schema.restaurantRatings).values({
        restaurantId: restId,
        userId: u.id,
        score,
      });
      ratingsCreated += 1;
    }
  }
  console.log(`  + ${ratingsCreated} rating creati (${ratingCandidates.length} utenti × 4 ristoranti).`);

  // ─── Step 7: proposte demo per oggi e domani ──────────────────────────────
  console.log('');
  console.log('🌱 Step 7 — proposte demo');
  console.log('─'.repeat(60));

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  const PROPOSALS = [
    {
      creatorEmail: 'mario.rossi@desko.local',
      restaurantSlug: 'berbere-isola',
      date: todayStr,
      meetingTime: '13:00',
      visibility: 'public' as const,
      note: 'Pranzo veloce, pizza margherita per tutti? 🍕',
      participantsEmails: ['anna.neri@desko.local', 'marco.gallo@desko.local'],
    },
    {
      creatorEmail: 'lucia.bianchi@desko.local',
      restaurantSlug: 'pave-break',
      date: todayStr,
      meetingTime: '12:30',
      visibility: 'public' as const,
      note: 'Insalatona del giorno e dolce!',
      participantsEmails: ['davide.conti@desko.local'],
    },
    {
      creatorEmail: 'sara.romano@desko.local',
      restaurantSlug: 'ratana',
      date: tomorrowStr,
      meetingTime: '13:30',
      visibility: 'private' as const,
      note: 'Festeggiamo il deal chiuso 🥂',
      inviteEmails: [
        'paolo.verdi@desko.local',
        'simone.lombardi@desko.local',
        'giulia.mancini@desko.local',
      ],
      participantsEmails: ['paolo.verdi@desko.local'],
    },
  ];

  let proposalsCreated = 0;
  for (const p of PROPOSALS) {
    const creator = userByEmail.get(p.creatorEmail);
    const restId = restaurantBySlug.get(p.restaurantSlug);
    if (!creator || !restId) continue;

    // Skip se esiste già una proposta open per (creator, date)
    const existing = await db
      .select({ id: schema.lunchProposals.id })
      .from(schema.lunchProposals)
      .where(
        and(
          eq(schema.lunchProposals.createdBy, creator.id),
          eq(schema.lunchProposals.date, p.date),
          eq(schema.lunchProposals.status, 'open'),
        ),
      )
      .limit(1);
    if (existing.length > 0) continue;

    const proposalId = randomUUID();
    await db.insert(schema.lunchProposals).values({
      id: proposalId,
      createdBy: creator.id,
      restaurantId: restId,
      date: p.date,
      meetingTime: p.meetingTime,
      visibility: p.visibility,
      note: p.note,
    });

    // Creator come partecipante
    await db.insert(schema.lunchProposalParticipants).values({
      proposalId,
      userId: creator.id,
    });

    // Partecipanti aggiuntivi
    for (const email of p.participantsEmails ?? []) {
      const u = userByEmail.get(email);
      if (!u) continue;
      await db
        .insert(schema.lunchProposalParticipants)
        .values({ proposalId, userId: u.id })
        .onConflictDoNothing();
    }

    // Inviti (per le private)
    if (p.visibility === 'private') {
      const invites = p.inviteEmails ?? [];
      for (const email of invites) {
        const u = userByEmail.get(email);
        if (!u) continue;
        await db
          .insert(schema.lunchProposalInvites)
          .values({ proposalId, userId: u.id })
          .onConflictDoNothing();
      }
    }

    proposalsCreated += 1;
    console.log(
      `  + ${p.visibility.padEnd(8)} ${p.date} @${p.meetingTime}  ${p.creatorEmail.split('@')[0]} → ${p.restaurantSlug}`,
    );
  }
  console.log(`  Totale: ${proposalsCreated} proposte demo create.`);

  await pool.end();

  console.log('');
  console.log('─'.repeat(60));
  console.log(`✅ Seed completato — ${created} creati, ${updated} aggiornati.`);
  console.log(
    `   Patterns: ${patternsCreated} creati, ${patternsUpdated} aggiornati. Follows: ${followsCreated} nuovi.`,
  );
  console.log('');
  console.log('Login (qualsiasi utente, password comune):');
  console.log(`  URL:      ${process.env.BETTER_AUTH_URL ?? 'http://localhost:3010'}/login`);
  console.log(`  Password: ${COMMON_PASSWORD}`);
  console.log('');
  console.log('Account chiave per i test:');
  console.log('  admin@desko.local       → admin (gestione utenti + analytics)');
  console.log('  hr@desko.local          → hr_analytics (solo analytics aggregato)');
  console.log('  mario.rossi@desko.local → user (flusso standard)');
  console.log('  luca.ferrari@desko.local → user bannato (chip rosso)');
  console.log('  elena.greco@desko.local  → user con email non verificata');
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Seed fallito:', e);
    process.exit(1);
  });
