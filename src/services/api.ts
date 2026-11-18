import type {
  AiCritiqueResponse,
  AiRoutineResponse,
  DailyHydration,
  Drill,
  NutritionLog,
  SchemaTableInfo,
  TrainingLog,
  User,
} from '../types.ts';

const TOKEN_STORAGE_KEY = 'welhoop_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = (data && typeof data.error === 'string' && data.error) || `Request failed (${res.status})`;
    throw new Error(errMsg);
  }
  return data as T;
}

export const api = {
  // Auth
  async register(payload: {
    name: string;
    email: string;
    password: string;
    position: string;
    height_cm: number;
    weight_kg: number;
    goal: string;
  }) {
    const res = await apiFetch<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.token);
    return res.user;
  },

  async login(email: string, password: string) {
    const res = await apiFetch<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res.user;
  },

  async demoLogin() {
    const res = await apiFetch<{ user: User; token: string }>('/api/auth/demo', {
      method: 'POST',
    });
    setStoredToken(res.token);
    return res.user;
  },

  async logout() {
    try {
      await apiFetch<{ ok: boolean }>('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  async getMe() {
    const res = await apiFetch<{ user: User }>('/api/auth/me');
    return res.user;
  },

  async updateProfile(payload: Partial<User>) {
    const res = await apiFetch<{ user: User }>('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.user;
  },

  // Drills
  async getDrills(category?: string) {
    const query = category && category !== 'All' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await apiFetch<{ drills: Drill[] }>(`/api/drills${query}`);
    return res.drills;
  },

  // Training Logs
  async getTrainingLogs() {
    const res = await apiFetch<{ logs: TrainingLog[] }>('/api/training-logs');
    return res.logs;
  },

  async createTrainingLog(payload: {
    drill_id?: number | null;
    drill_title: string;
    category: string;
    duration_mins: number;
    notes?: string;
  }) {
    const res = await apiFetch<{ log: TrainingLog }>('/api/training-logs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.log;
  },

  async deleteTrainingLog(id: number) {
    return apiFetch<{ deletedId: number }>(`/api/training-logs/${id}`, {
      method: 'DELETE',
    });
  },

  // Nutrition Logs
  async getNutritionLogs() {
    const res = await apiFetch<{ logs: NutritionLog[] }>('/api/nutrition-logs');
    return res.logs;
  },

  async createNutritionLog(payload: {
    meal_timing: string;
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
  }) {
    const res = await apiFetch<{ log: NutritionLog }>('/api/nutrition-logs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.log;
  },

  async deleteNutritionLog(id: number) {
    return apiFetch<{ deletedId: number }>(`/api/nutrition-logs/${id}`, {
      method: 'DELETE',
    });
  },

  // Hydration
  async getHydration(dateKey?: string) {
    const q = dateKey ? `?date=${encodeURIComponent(dateKey)}` : '';
    const res = await apiFetch<{ hydration: DailyHydration }>(`/api/hydration${q}`);
    return res.hydration;
  },

  async setHydration(glasses_count: number, date?: string) {
    const res = await apiFetch<{ hydration: DailyHydration }>('/api/hydration', {
      method: 'POST',
      body: JSON.stringify({ glasses_count, date }),
    });
    return res.hydration;
  },

  // AI Coach
  async generateRoutine(payload: { focusSkill: string; availableMins: number; equipment: string }) {
    const res = await apiFetch<{ mode: 'routine'; data: AiRoutineResponse }>('/api/ai-coach', {
      method: 'POST',
      body: JSON.stringify({ mode: 'routine', ...payload }),
    });
    return res.data;
  },

  async generateCritique() {
    const res = await apiFetch<{ mode: 'critique'; data: AiCritiqueResponse }>('/api/ai-coach', {
      method: 'POST',
      body: JSON.stringify({ mode: 'critique' }),
    });
    return res.data;
  },

  // Schema viewer
  async getSchema() {
    return apiFetch<{ engine: string; databaseFile: string; tables: SchemaTableInfo[] }>('/api/schema');
  },
};
