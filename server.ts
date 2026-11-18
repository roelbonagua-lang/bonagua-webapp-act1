import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import { GoogleGenAI, Type } from '@google/genai';
import { calculateMacroTargets, getLocalDateKey } from './src/utils/hoopLogic.ts';
import type { SchemaColumnInfo, SchemaTableInfo } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DB_PATH = path.join(__dirname, 'welhoop.db');
const AUTH_SECRET = process.env.SESSION_SECRET || 'welhoop-court-secret-key-2026';

// Initialize SQLite database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      position TEXT NOT NULL DEFAULT 'Point Guard',
      height_cm INTEGER NOT NULL DEFAULT 180,
      weight_kg REAL NOT NULL DEFAULT 75,
      goal TEXT NOT NULL DEFAULT 'Game-Day Stamina',
      daily_calorie_target INTEGER NOT NULL DEFAULT 2600,
      daily_protein_target INTEGER NOT NULL DEFAULT 140,
      daily_skill_mins_target INTEGER NOT NULL DEFAULT 60
    );

    CREATE TABLE IF NOT EXISTS drills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      duration_mins INTEGER NOT NULL,
      sets_reps TEXT NOT NULL,
      instructions TEXT NOT NULL,
      donts_warning TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS training_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      drill_id INTEGER,
      drill_title TEXT NOT NULL,
      category TEXT NOT NULL,
      duration_mins INTEGER NOT NULL,
      notes TEXT DEFAULT '',
      logged_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (drill_id) REFERENCES drills(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS nutrition_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      meal_timing TEXT NOT NULL,
      food_name TEXT NOT NULL,
      calories INTEGER NOT NULL,
      protein_g INTEGER NOT NULL,
      carbs_g INTEGER NOT NULL,
      logged_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_hydration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      glasses_count INTEGER NOT NULL DEFAULT 0,
      date TEXT NOT NULL,
      UNIQUE(user_id, date),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed drills if empty
  const drillCountRow = db.prepare('SELECT COUNT(*) as cnt FROM drills').get() as { cnt: number };
  if (drillCountRow.cnt === 0) {
    const insertDrill = db.prepare(`
      INSERT INTO drills (category, title, difficulty, duration_mins, sets_reps, instructions, donts_warning)
      VALUES (@category, @title, @difficulty, @duration_mins, @sets_reps, @instructions, @donts_warning)
    `);

    const seedDrills = [
      // 1. Dribbling & Ball Handling
      {
        category: 'Dribbling & Ball Handling',
        title: 'Two-Ball Rhythm Pound & Split',
        difficulty: 'Intermediate',
        duration_mins: 15,
        sets_reps: '4 sets x 45 secs each',
        instructions:
          'Stay in an athletic quarter-squat stance with eyes locked on the opposite rim. Pound both basketballs simultaneously at knee height for 20 reps, then alternate piston dribbles without changing hip height.',
        donts_warning:
          'Do not stand upright or stare at the basketballs—keep your chest up so you can read defenders and passing lanes.',
      },
      {
        category: 'Dribbling & Ball Handling',
        title: 'Pocket Dribble & Hesitation Attack',
        difficulty: 'Pro',
        duration_mins: 20,
        sets_reps: '5 sets x 10 reps per side',
        instructions:
          'Approach an imaginary defender cone, float the ball briefly into your hip pocket while dropping your back foot, then explode past the outside hip into a tight one-dribble pull-up or finish.',
        donts_warning:
          'Do not rotate your palm completely underneath the ball during the hesitation—keep your hand on the side/top to avoid carrying violations.',
      },
      {
        category: 'Dribbling & Ball Handling',
        title: 'Figure-8 Spider & Low Sweep',
        difficulty: 'Beginner',
        duration_mins: 10,
        sets_reps: '3 sets x 60 secs',
        instructions:
          'Keep your feet wide and hips low. Whip low, crisp fingertips dribbles in a tight figure-8 around both ankles, then reverse direction after 30 seconds.',
        donts_warning:
          'Do not slap the ball with flat palms—control every bounce through your finger pads and wrist snap.',
      },

      // 2. Weak / Left-Hand Mastery
      {
        category: 'Weak / Left-Hand Mastery',
        title: 'Left-Hand Only Mikan & Reverse Finish',
        difficulty: 'Beginner',
        duration_mins: 15,
        sets_reps: '4 sets x 12 makes',
        instructions:
          'Stand directly beneath the rim and finish 12 consecutive left-hand bank layups alternating sides of the backboard without letting the ball touch the floor. Keep your right hand tucked behind your back for strict isolation.',
        donts_warning:
          'Do not look down at the ball or guide the layup with your right hand—trust your left-hand touch off the glass.',
      },
      {
        category: 'Weak / Left-Hand Mastery',
        title: 'Weak-Hand Full-Court Speed Dribble',
        difficulty: 'Intermediate',
        duration_mins: 15,
        sets_reps: '6 full-court lengths',
        instructions:
          'Push the ball out ahead of your left hip at a 45-degree angle so you can sprint at 90% speed. At each baseline, decelerate with a left-hand inside-out fake before turning back.',
        donts_warning:
          'Do not dribble directly in front of your toes while sprinting—keep the ball outside your left shoulder frame to avoid kicking it.',
      },
      {
        category: 'Weak / Left-Hand Mastery',
        title: 'Off-Hand Contact Floater & Hook',
        difficulty: 'Pro',
        duration_mins: 20,
        sets_reps: '4 sets x 8 makes per spot',
        instructions:
          'Drive left down the lane, absorb bump contact on your right shoulder pad, jump off two feet, and release a soft high-arc left-hand floater over outstretched hands.',
        donts_warning:
          'Do not fade backwards away from contact—jump vertically on balance so your release stays repeatable.',
      },

      // 3. Shooting & Mechanics
      {
        category: 'Shooting & Mechanics',
        title: 'One-Hand Form Shooting Progression',
        difficulty: 'Beginner',
        duration_mins: 15,
        sets_reps: '50 swishes from 3–8 feet',
        instructions:
          'Place your shooting elbow directly under the ball at 90 degrees with your guide hand off the ball. Elevate smoothly through legs, hips, and wrist, holding the goose-neck follow-through until the net settles.',
        donts_warning:
          'Do not drop your elbow outward ("chicken wing") or snap your wrist early before reaching the peak of your release.',
      },
      {
        category: 'Shooting & Mechanics',
        title: 'Catch-and-Shoot Hop Balance Series',
        difficulty: 'Intermediate',
        duration_mins: 20,
        sets_reps: '5 spots x 10 makes',
        instructions:
          'Spin the ball out to the perimeter, step/hop cleanly into a balanced catch with knees already loaded, and rise straight into your shot pocket without dipping the ball below your waist.',
        donts_warning:
          'Do not catch with straight legs and then bend down—pre-load your hips before the ball hits your hands to cut 0.3 seconds off your release.',
      },
      {
        category: 'Shooting & Mechanics',
        title: 'Game-Speed Relocation 3-Pointers',
        difficulty: 'Pro',
        duration_mins: 25,
        sets_reps: '4 sets x 8 shots per corner/wing',
        instructions:
          'Sprint from the baseline corner to the 45-degree wing at game pace, plant your inside foot to square your shoulders mid-catch, and shoot immediately.',
        donts_warning:
          'Do not drift sideways on your jump shot—land in the exact footprint or slightly forward of where you took off.',
      },

      // 4. Vertical Jump & Explosiveness
      {
        category: 'Vertical Jump & Explosiveness',
        title: 'Approach Box Jumps & Stick Landings',
        difficulty: 'Intermediate',
        duration_mins: 20,
        sets_reps: '4 sets x 5 explosive reps (90s rest)',
        instructions:
          'Take a sharp penultimate two-step approach, swing both arms aggressively upward, and explode onto a 24–30 inch box. Absorb the landing silently with knees tracking over toes.',
        donts_warning:
          'Do not perform max-effort plyometrics on concrete without 48-hour recovery—protect your patellar tendons and ankles.',
      },
      {
        category: 'Vertical Jump & Explosiveness',
        title: 'Depth Drops to Broad Jump',
        difficulty: 'Pro',
        duration_mins: 15,
        sets_reps: '4 sets x 4 reps (2m rest)',
        instructions:
          'Step off a 16-inch box, land in an athletic reactive squat for under 0.2 seconds, and immediately rebound horizontally into a maximum-distance broad jump.',
        donts_warning:
          'Do not allow your knees to cave inward (valgus collapse) on landing—drive knees outward over your pinky toes.',
      },
      {
        category: 'Vertical Jump & Explosiveness',
        title: 'Single-Leg Pogo Hops & Tibialis Raises',
        difficulty: 'Beginner',
        duration_mins: 15,
        sets_reps: '3 sets x 20 contacts per leg',
        instructions:
          'Bounce off the balls of your feet keeping your ankle stiff like a spring, minimizing ground contact time. Pair with 20 wall tibialis raises to bulletproof shin splints.',
        donts_warning:
          'Do not slam your heels into the hardwood on each hop—stay elastic on the forefoot.',
      },

      // 5. Stamina & Court Conditioning
      {
        category: 'Stamina & Court Conditioning',
        title: '17s Sideline Conditioning Sprints',
        difficulty: 'Pro',
        duration_mins: 20,
        sets_reps: '4 sets (60s target, 90s rest)',
        instructions:
          'Sprint sideline-to-sideline 17 times in under 60 seconds, touching each line cleanly with your hand while dropping your hips to decelerate and re-accelerate.',
        donts_warning:
          'Do not round your turns or coast through the final 3 lines—plant hard outside-foot-first to simulate fourth-quarter defensive slides.',
      },
      {
        category: 'Stamina & Court Conditioning',
        title: 'Full-Court Make-or-Sprint Transition',
        difficulty: 'Intermediate',
        duration_mins: 20,
        sets_reps: '12 full-court trips',
        instructions:
          'Push a full-court sprint dribble into an elbow pull-up or layup. If you miss, sprint back to the opposite baseline and run a defensive closeout before resetting.',
        donts_warning:
          'Do not rush mechanics when fatigued—keep breathing through your nose during free throws and lock in your follow-through.',
      },
      {
        category: 'Stamina & Court Conditioning',
        title: 'Defensive Slide & Closeout Ladder',
        difficulty: 'Beginner',
        duration_mins: 15,
        sets_reps: '5 sets x 45 secs',
        instructions:
          'Start in a low defensive stance, slide laterally across the paint without crossing your feet, sprint out into a choppy-step high-hand closeout at the wing, and backpedal.',
        donts_warning:
          'Do not cross your ankles or click your heels during lateral slides—maintain a wide base so quick guards cannot blow past you.',
      },
    ];

    const seedAll = db.transaction((items: typeof seedDrills) => {
      for (const item of items) {
        insertDrill.run(item);
      }
    });
    seedAll(seedDrills);
  }

  // Ensure Demo Athlete account exists for One-Click Demo Athlete Login
  ensureDemoAthleteExists();
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function signToken(userId: number): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, iat: Date.now() })).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  if (sig.length !== expectedSig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { uid?: number };
    return typeof parsed.uid === 'number' ? parsed.uid : null;
  } catch {
    return null;
  }
}

function ensureDemoAthleteExists(): number {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@welhoop.app') as
    | { id: number }
    | undefined;

  if (existing) {
    return existing.id;
  }

  const macros = calculateMacroTargets(76, 182, 'Game-Day Stamina');
  const result = db
    .prepare(`
      INSERT INTO users (
        name, email, password_hash, position, height_cm, weight_kg, goal,
        daily_calorie_target, daily_protein_target, daily_skill_mins_target
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      'Marcus Reyes',
      'demo@welhoop.app',
      hashPassword('welhoop2026'),
      'Point Guard',
      182,
      76,
      'Game-Day Stamina',
      macros.daily_calorie_target,
      macros.daily_protein_target,
      60
    );

  const demoUserId = Number(result.lastInsertRowid);

  // Seed realistic training logs across past 5 days + today (45 mins today vs 60 target)
  const now = new Date();
  const makeIsoDaysAgo = (daysAgo: number, hour: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hour, 15, 0, 0);
    return d.toISOString();
  };

  const insertTraining = db.prepare(`
    INSERT INTO training_logs (user_id, drill_id, drill_title, category, duration_mins, notes, logged_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertTraining.run(
    demoUserId,
    4,
    'Left-Hand Only Mikan & Reverse Finish',
    'Weak / Left-Hand Mastery',
    20,
    'Hit 12 straight off the glass without right-hand assist.',
    makeIsoDaysAgo(0, 7)
  );
  insertTraining.run(
    demoUserId,
    7,
    'One-Hand Form Shooting Progression',
    'Shooting & Mechanics',
    25,
    'Focused on high elbow alignment and clean arc.',
    makeIsoDaysAgo(0, 8)
  );
  insertTraining.run(
    demoUserId,
    1,
    'Two-Ball Rhythm Pound & Split',
    'Dribbling & Ball Handling',
    30,
    'Felt sharp keeping eyes on opposite rim.',
    makeIsoDaysAgo(1, 17)
  );
  insertTraining.run(
    demoUserId,
    10,
    'Approach Box Jumps & Stick Landings',
    'Vertical Jump & Explosiveness',
    25,
    'Soft landings on hardwood, zero knee pain.',
    makeIsoDaysAgo(2, 18)
  );
  insertTraining.run(
    demoUserId,
    13,
    '17s Sideline Conditioning Sprints',
    'Stamina & Court Conditioning',
    20,
    'Cleared all 4 sets under 58 seconds.',
    makeIsoDaysAgo(3, 17)
  );
  insertTraining.run(
    demoUserId,
    5,
    'Weak-Hand Full-Court Speed Dribble',
    'Weak / Left-Hand Mastery',
    20,
    'Improved left-hand deceleration on baseline turn.',
    makeIsoDaysAgo(4, 16)
  );

  // Seed today's nutrition logs
  const insertNutrition = db.prepare(`
    INSERT INTO nutrition_logs (user_id, meal_timing, food_name, calories, protein_g, carbs_g, logged_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertNutrition.run(
    demoUserId,
    'Pre-Game Fuel',
    'Rolled Oatmeal Bowl with Honey',
    320,
    10,
    58,
    makeIsoDaysAgo(0, 6)
  );
  insertNutrition.run(
    demoUserId,
    'Daily Meals',
    'Boiled Eggs (3 large)',
    215,
    19,
    2,
    makeIsoDaysAgo(0, 9)
  );
  insertNutrition.run(
    demoUserId,
    'Post-Game Recovery',
    'Chicken Breast & Steamed Rice',
    485,
    42,
    62,
    makeIsoDaysAgo(0, 12)
  );

  // Seed today's hydration (5 / 8 glasses)
  db.prepare(`
    INSERT OR IGNORE INTO daily_hydration (user_id, glasses_count, date)
    VALUES (?, ?, ?)
  `).run(demoUserId, 5, getLocalDateKey(now));

  return demoUserId;
}

initializeDatabase();

// Express Setup
const app = express();
app.use(express.json({ limit: '1mb' }));

interface AuthRequest extends Request {
  userId?: number;
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const pairs = cookieHeader.split(';');
    for (const pair of pairs) {
      const idx = pair.indexOf('=');
      if (idx > 0) {
        const key = pair.slice(0, idx).trim();
        const val = pair.slice(idx + 1).trim();
        if (key === 'welhoop_token') {
          return decodeURIComponent(val);
        }
      }
    }
  }
  return null;
}

function setAuthCookie(res: Response, token: string) {
  res.cookie('welhoop_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
  });
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in to WelHoop.' });
    return;
  }
  const uid = verifyToken(token);
  if (!uid) {
    res.status(401).json({ error: 'Invalid or expired session. Please sign in again.' });
    return;
  }
  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(uid) as { id: number } | undefined;
  if (!userExists) {
    res.status(401).json({ error: 'Account no longer exists.' });
    return;
  }
  req.userId = uid;
  next();
}

function getSafeUserById(userId: number) {
  return db
    .prepare(
      `SELECT id, name, email, position, height_cm, weight_kg, goal,
              daily_calorie_target, daily_protein_target, daily_skill_mins_target
       FROM users WHERE id = ?`
    )
    .get(userId);
}

// ============================================================
// AUTH ROUTES (/api/auth)
// ============================================================
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, position, height_cm, weight_kg, goal } = req.body ?? {};
  if (!name || typeof name !== 'string' || !email || typeof email !== 'string' || !password || typeof password !== 'string') {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'An athlete account with this email already exists.' });
    return;
  }

  const safeHeight = Number(height_cm) || 180;
  const safeWeight = Number(weight_kg) || 75;
  const safeGoal = goal || 'Game-Day Stamina';
  const safePosition = position || 'Point Guard';
  const macros = calculateMacroTargets(safeWeight, safeHeight, safeGoal);

  const info = db
    .prepare(`
      INSERT INTO users (
        name, email, password_hash, position, height_cm, weight_kg, goal,
        daily_calorie_target, daily_protein_target, daily_skill_mins_target
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      name.trim(),
      normalizedEmail,
      hashPassword(password),
      safePosition,
      safeHeight,
      safeWeight,
      safeGoal,
      macros.daily_calorie_target,
      macros.daily_protein_target,
      60
    );

  const userId = Number(info.lastInsertRowid);
  const token = signToken(userId);
  setAuthCookie(res, token);
  res.status(201).json({ user: getSafeUserById(userId), token });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  const row = db.prepare('SELECT id, password_hash FROM users WHERE email = ?').get(normalizedEmail) as
    | { id: number; password_hash: string }
    | undefined;

  if (!row || !verifyPassword(String(password), row.password_hash)) {
    res.status(401).json({ error: 'Incorrect email or password.' });
    return;
  }

  const token = signToken(row.id);
  setAuthCookie(res, token);
  res.json({ user: getSafeUserById(row.id), token });
});

app.post('/api/auth/demo', (_req: Request, res: Response) => {
  const demoId = ensureDemoAthleteExists();
  const token = signToken(demoId);
  setAuthCookie(res, token);
  res.json({ user: getSafeUserById(demoId), token });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('welhoop_token', { path: '/' });
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = getSafeUserById(req.userId!);
  res.json({ user });
});

app.patch('/api/auth/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const current = getSafeUserById(req.userId!) as {
    name: string;
    position: string;
    height_cm: number;
    weight_kg: number;
    goal: string;
    daily_skill_mins_target: number;
  };

  const nextName = typeof req.body.name === 'string' && req.body.name.trim() ? req.body.name.trim() : current.name;
  const nextPosition =
    typeof req.body.position === 'string' && req.body.position.trim() ? req.body.position.trim() : current.position;
  const nextHeight = Number(req.body.height_cm) > 0 ? Number(req.body.height_cm) : current.height_cm;
  const nextWeight = Number(req.body.weight_kg) > 0 ? Number(req.body.weight_kg) : current.weight_kg;
  const nextGoal = typeof req.body.goal === 'string' && req.body.goal.trim() ? req.body.goal.trim() : current.goal;
  const nextSkillTarget =
    Number(req.body.daily_skill_mins_target) > 0
      ? Number(req.body.daily_skill_mins_target)
      : current.daily_skill_mins_target;

  const macros = calculateMacroTargets(nextWeight, nextHeight, nextGoal);

  db.prepare(`
    UPDATE users
    SET name = ?, position = ?, height_cm = ?, weight_kg = ?, goal = ?,
        daily_calorie_target = ?, daily_protein_target = ?, daily_skill_mins_target = ?
    WHERE id = ?
  `).run(
    nextName,
    nextPosition,
    nextHeight,
    nextWeight,
    nextGoal,
    macros.daily_calorie_target,
    macros.daily_protein_target,
    nextSkillTarget,
    req.userId!
  );

  res.json({ user: getSafeUserById(req.userId!) });
});

// ============================================================
// DRILLS ROUTES (/api/drills)
// ============================================================
app.get('/api/drills', requireAuth, (req: AuthRequest, res: Response) => {
  const category = typeof req.query.category === 'string' ? req.query.category : '';
  const drills =
    category && category !== 'All'
      ? db.prepare('SELECT * FROM drills WHERE category = ? ORDER BY id ASC').all(category)
      : db.prepare('SELECT * FROM drills ORDER BY id ASC').all();
  res.json({ drills });
});

// ============================================================
// TRAINING LOGS ROUTES (/api/training-logs)
// ============================================================
app.get('/api/training-logs', requireAuth, (req: AuthRequest, res: Response) => {
  const logs = db
    .prepare('SELECT * FROM training_logs WHERE user_id = ? ORDER BY datetime(logged_at) DESC, id DESC')
    .all(req.userId!);
  res.json({ logs });
});

app.post('/api/training-logs', requireAuth, (req: AuthRequest, res: Response) => {
  const { drill_id, drill_title, category, duration_mins, notes } = req.body ?? {};
  if (!drill_title || !category || !duration_mins || Number(duration_mins) <= 0) {
    res.status(400).json({ error: 'Drill title, category, and positive duration are required.' });
    return;
  }

  const loggedAt = new Date().toISOString();
  const info = db
    .prepare(`
      INSERT INTO training_logs (user_id, drill_id, drill_title, category, duration_mins, notes, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      req.userId!,
      drill_id ? Number(drill_id) : null,
      String(drill_title).trim(),
      String(category).trim(),
      Math.round(Number(duration_mins)),
      typeof notes === 'string' ? notes.trim() : '',
      loggedAt
    );

  const created = db.prepare('SELECT * FROM training_logs WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ log: created });
});

app.delete('/api/training-logs/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const logId = Number(req.params.id);
  const result = db.prepare('DELETE FROM training_logs WHERE id = ? AND user_id = ?').run(logId, req.userId!);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Training log not found.' });
    return;
  }
  res.json({ deletedId: logId });
});

// ============================================================
// NUTRITION LOGS ROUTES (/api/nutrition-logs)
// ============================================================
app.get('/api/nutrition-logs', requireAuth, (req: AuthRequest, res: Response) => {
  const logs = db
    .prepare('SELECT * FROM nutrition_logs WHERE user_id = ? ORDER BY datetime(logged_at) DESC, id DESC')
    .all(req.userId!);
  res.json({ logs });
});

app.post('/api/nutrition-logs', requireAuth, (req: AuthRequest, res: Response) => {
  const { meal_timing, food_name, calories, protein_g, carbs_g } = req.body ?? {};
  if (!meal_timing || !food_name || calories === undefined || Number(calories) < 0) {
    res.status(400).json({ error: 'Meal timing, food name, and valid calories are required.' });
    return;
  }

  const loggedAt = new Date().toISOString();
  const info = db
    .prepare(`
      INSERT INTO nutrition_logs (user_id, meal_timing, food_name, calories, protein_g, carbs_g, logged_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      req.userId!,
      String(meal_timing).trim(),
      String(food_name).trim(),
      Math.round(Number(calories)),
      Math.max(0, Math.round(Number(protein_g) || 0)),
      Math.max(0, Math.round(Number(carbs_g) || 0)),
      loggedAt
    );

  const created = db.prepare('SELECT * FROM nutrition_logs WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ log: created });
});

app.delete('/api/nutrition-logs/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const logId = Number(req.params.id);
  const result = db.prepare('DELETE FROM nutrition_logs WHERE id = ? AND user_id = ?').run(logId, req.userId!);
  if (result.changes === 0) {
    res.status(404).json({ error: 'Nutrition log not found.' });
    return;
  }
  res.json({ deletedId: logId });
});

// ============================================================
// HYDRATION ROUTES (/api/hydration)
// ============================================================
app.get('/api/hydration', requireAuth, (req: AuthRequest, res: Response) => {
  const todayKey = typeof req.query.date === 'string' && req.query.date ? req.query.date : getLocalDateKey();
  const row = db
    .prepare('SELECT * FROM daily_hydration WHERE user_id = ? AND date = ?')
    .get(req.userId!, todayKey) as { id: number; user_id: number; glasses_count: number; date: string } | undefined;

  res.json({
    hydration: row || { id: 0, user_id: req.userId!, glasses_count: 0, date: todayKey },
  });
});

app.post('/api/hydration', requireAuth, (req: AuthRequest, res: Response) => {
  const glassesCount = Math.max(0, Math.min(16, Math.round(Number(req.body?.glasses_count ?? 0))));
  const dateKey = typeof req.body?.date === 'string' && req.body.date ? req.body.date : getLocalDateKey();

  db.prepare(`
    INSERT INTO daily_hydration (user_id, glasses_count, date)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET glasses_count = excluded.glasses_count
  `).run(req.userId!, glassesCount, dateKey);

  const updated = db
    .prepare('SELECT * FROM daily_hydration WHERE user_id = ? AND date = ?')
    .get(req.userId!, dateKey);
  res.json({ hydration: updated });
});

// ============================================================
// GEMINI AI WELHOOP COACH (/api/ai-coach)
// ============================================================
app.post('/api/ai-coach', requireAuth, async (req: AuthRequest, res: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.status(503).json({
      error: 'Gemini API key is not configured. Please add GEMINI_API_KEY in the Settings > Secrets panel.',
    });
    return;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const user = getSafeUserById(req.userId!) as {
    name: string;
    position: string;
    height_cm: number;
    weight_kg: number;
    goal: string;
    daily_calorie_target: number;
    daily_protein_target: number;
    daily_skill_mins_target: number;
  };

  const mode = req.body?.mode === 'critique' ? 'critique' : 'routine';

  try {
    if (mode === 'routine') {
      const focusSkill = String(req.body?.focusSkill || 'Weak / Left-Hand Mastery + Stamina');
      const availableMins = Math.max(15, Math.min(120, Number(req.body?.availableMins) || 45));
      const equipment = String(req.body?.equipment || '1 basketball, outdoor/indoor hoop, cones');

      const prompt = `Build a personalized basketball practice & fueling plan for this athlete:
- Athlete: ${user.name}, Position: ${user.position}, Height: ${user.height_cm}cm, Weight: ${user.weight_kg}kg
- Goal: ${user.goal} (Daily Targets: ${user.daily_calorie_target} kcal, ${user.daily_protein_target}g protein)
- Focus Skill: ${focusSkill}
- Available Time: ${availableMins} minutes
- Available Equipment: ${equipment}

Design a concise, practical, high-impact routine with exact durations totaling ~${availableMins} minutes, budget-friendly pre-game and post-game meal suggestions, and 3 concrete "Mistakes to Avoid" for injury prevention and proper mechanics.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'You are WelHoop AI Coach, an elite basketball skill development trainer and sports nutritionist. Be practical, concise, and specific.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              routineTitle: { type: Type.STRING },
              warmup: { type: Type.STRING },
              drills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    durationMins: { type: Type.INTEGER },
                    setsReps: { type: Type.STRING },
                    coachingCue: { type: Type.STRING },
                  },
                },
              },
              mealPlan: {
                type: Type.OBJECT,
                properties: {
                  preGame: { type: Type.STRING },
                  postGame: { type: Type.STRING },
                },
              },
              mistakesToAvoid: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ mode: 'routine', data: parsed });
      return;
    }

    // Mode: Weekly Progress Critique using real SQLite training_logs & nutrition_logs
    const recentTraining = db
      .prepare(
        `SELECT drill_title, category, duration_mins, notes, logged_at
         FROM training_logs
         WHERE user_id = ?
         ORDER BY datetime(logged_at) DESC
         LIMIT 25`
      )
      .all(req.userId!);

    const recentNutrition = db
      .prepare(
        `SELECT meal_timing, food_name, calories, protein_g, carbs_g, logged_at
         FROM nutrition_logs
         WHERE user_id = ?
         ORDER BY datetime(logged_at) DESC
         LIMIT 25`
      )
      .all(req.userId!);

    const todayHydration = db
      .prepare('SELECT glasses_count, date FROM daily_hydration WHERE user_id = ? ORDER BY date DESC LIMIT 7')
      .all(req.userId!);

    const prompt = `Analyze this basketball athlete's real training and nutrition logs from our database and deliver an honest, actionable Weekly Progress Critique:

Athlete Profile:
${JSON.stringify(user)}

Recent Training Logs:
${JSON.stringify(recentTraining)}

Recent Nutrition Logs:
${JSON.stringify(recentNutrition)}

Recent Hydration Logs:
${JSON.stringify(todayHydration)}

Provide specific feedback referencing their actual logged drills, category balance (e.g., whether weak-hand, vertical, or conditioning is neglected), protein/calorie pacing against targets, and concrete mistakes to avoid.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction:
          'You are WelHoop AI Coach. Analyze real athlete logs accurately without inventing workouts that do not appear in the data.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            trainingSummary: { type: Type.STRING },
            nutritionSummary: { type: Type.STRING },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            priorityAdjustments: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            mistakesToAvoid: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json({ mode: 'critique', data: parsed });
  } catch (err: unknown) {
    console.error('Gemini AI Coach error:', err);
    const message = err instanceof Error ? err.message : 'Failed to reach WelHoop AI Coach.';
    res.status(502).json({ error: message });
  }
});

// ============================================================
// DATABASE SCHEMA INSPECTOR (/api/schema)
// ============================================================
app.get('/api/schema', requireAuth, (_req: AuthRequest, res: Response) => {
  const tableRows = db
    .prepare(
      `SELECT name, sql FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name ASC`
    )
    .all() as { name: string; sql: string }[];

  const tables: SchemaTableInfo[] = tableRows.map((t) => {
    const columns = db.prepare(`PRAGMA table_info(${t.name})`).all() as SchemaColumnInfo[];
    const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM ${t.name}`).get() as { cnt: number };
    return {
      name: t.name,
      sql: t.sql,
      rowCount: countRow.cnt,
      columns,
    };
  });

  res.json({ engine: 'SQLite (better-sqlite3)', databaseFile: 'welhoop.db', tables });
});

// ============================================================
// VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PROD)
// ============================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WelHoop full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start WelHoop server:', err);
  process.exit(1);
});
