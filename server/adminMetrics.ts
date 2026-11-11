import crypto from "crypto";
import fs from "fs";
import path from "path";

export interface RecentEvent {
  id: string;
  type: "novo_usuario" | "anuncio_gerado" | "anuncio_analisado" | "ad_generated" | "ad_analyzed";
  title: string;
  timestamp: number;
}

export interface DayStat {
  date: string; // YYYY-MM-DD
  label: string; // DD/MM
  activeUsers: number;
  adsGenerated: number;
  adsAnalyzed: number;
}

export interface AnonymousSessionInfo {
  idHash: string; // e.g., "sessão #c9a4"
  lastSeenSecondsAgo: number;
  status: "ativo" | "recente";
}

export interface AdminMetricsResponse {
  onlineUsers: number;
  totalUsers: number;
  adsGenerated: number;
  adsAnalyzed: number;
  activeUsersToday: number;
  activeUsersLast7Days: number;
  growthHistory7d: DayStat[];
  growthHistory30d: DayStat[];
  recentActivity: RecentEvent[];
  activeAnonymousSessions: AnonymousSessionInfo[];
  serverStatus: {
    status: "online" | "degraded";
    uptimeSeconds: number;
    aiEngine: string;
    metricsStorage: string;
    serverStartedAt: string;
  };
}

class AdminMetricsTracker {
  // Real-time telemetry store with persistent JSON backing to survive reloads/restarts
  private activeSessions = new Map<string, number>(); // sessionId -> lastActiveTimestamp
  private uniqueVisitors = new Set<string>();
  private totalGenerated = 0;
  private totalAnalyzed = 0;
  private recentEvents: RecentEvent[] = [];
  private dailyUserSets = new Map<string, Set<string>>(); // YYYY-MM-DD -> Set<sessionId>
  private dailyGeneratedCounts = new Map<string, number>(); // YYYY-MM-DD -> count
  private dailyAnalyzedCounts = new Map<string, number>(); // YYYY-MM-DD -> count
  private processedEventIds = new Set<string>(); // Event deduplication set
  private adminSessions = new Map<string, { createdAt: number; expiresAt: number }>();
  private serverStartTime = Date.now();
  private persistPath = path.join(process.cwd(), "server", ".metrics-store.json");
  private persistTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Load persisted state if exists
    this.loadFromFile();
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(this.persistPath)) {
        const raw = fs.readFileSync(this.persistPath, "utf-8");
        const data = JSON.parse(raw);
        if (typeof data.totalGenerated === "number") this.totalGenerated = data.totalGenerated;
        if (typeof data.totalAnalyzed === "number") this.totalAnalyzed = data.totalAnalyzed;
        if (Array.isArray(data.uniqueVisitors)) {
          this.uniqueVisitors = new Set(data.uniqueVisitors);
        }
        if (Array.isArray(data.processedEventIds)) {
          this.processedEventIds = new Set(data.processedEventIds);
        }
        if (Array.isArray(data.recentEvents)) {
          this.recentEvents = data.recentEvents;
        }
        if (Array.isArray(data.dailyGeneratedCounts)) {
          this.dailyGeneratedCounts = new Map(data.dailyGeneratedCounts);
        }
        if (Array.isArray(data.dailyAnalyzedCounts)) {
          this.dailyAnalyzedCounts = new Map(data.dailyAnalyzedCounts);
        }
        if (Array.isArray(data.dailyUserSets)) {
          this.dailyUserSets = new Map(
            data.dailyUserSets.map(([k, arr]: [string, string[]]) => [k, new Set(arr)])
          );
        }
      }
    } catch (err) {
      console.warn("Aviso ao carregar métricas persistidas:", err);
    }
  }

  private persistToFile() {
    if (this.persistTimer) return;
    this.persistTimer = setTimeout(() => {
      this.persistTimer = null;
      try {
        const payload = {
          totalGenerated: this.totalGenerated,
          totalAnalyzed: this.totalAnalyzed,
          uniqueVisitors: Array.from(this.uniqueVisitors),
          processedEventIds: Array.from(this.processedEventIds).slice(-3000), // Keep last 3000 event IDs
          recentEvents: this.recentEvents.slice(0, 50),
          dailyGeneratedCounts: Array.from(this.dailyGeneratedCounts.entries()),
          dailyAnalyzedCounts: Array.from(this.dailyAnalyzedCounts.entries()),
          dailyUserSets: Array.from(this.dailyUserSets.entries()).map(([k, set]) => [
            k,
            Array.from(set),
          ]),
        };
        fs.writeFileSync(this.persistPath, JSON.stringify(payload, null, 2), "utf-8");
      } catch (err) {
        console.warn("Aviso ao salvar métricas persistidas:", err);
      }
    }, 80);
  }

  private getTodayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  public recordSession(sessionId: string) {
    if (!sessionId || typeof sessionId !== "string") return;
    const now = Date.now();
    const isNew = !this.uniqueVisitors.has(sessionId);

    this.uniqueVisitors.add(sessionId);
    this.activeSessions.set(sessionId, now);

    const todayKey = this.getTodayKey();
    let todaySet = this.dailyUserSets.get(todayKey);
    if (!todaySet) {
      todaySet = new Set<string>();
      this.dailyUserSets.set(todayKey, todaySet);
    }
    todaySet.add(sessionId);

    if (isNew) {
      this.addRecentEvent({
        id: crypto.randomUUID(),
        type: "novo_usuario",
        title: "Novo usuário ativo no AnunciaAI",
        timestamp: now,
      });
      this.persistToFile();
    }
  }

  public recordEvent(params: {
    event: "ad_generated" | "ad_analyzed";
    eventId?: string;
    sessionId?: string;
    category?: string;
    score?: number;
    scoreLabel?: string;
  }): { success: boolean; duplicated: boolean; event: string; totalGenerated: number; totalAnalyzed: number } {
    const { event, eventId, sessionId, category, score, scoreLabel } = params;

    if (sessionId) {
      this.recordSession(sessionId);
    }

    if (eventId && typeof eventId === "string") {
      if (this.processedEventIds.has(eventId)) {
        return {
          success: true,
          duplicated: true,
          event,
          totalGenerated: this.totalGenerated,
          totalAnalyzed: this.totalAnalyzed,
        };
      }
      this.processedEventIds.add(eventId);
    }

    if (event === "ad_generated") {
      this.recordAdGenerated(category, eventId);
    } else if (event === "ad_analyzed") {
      this.recordAdAnalyzed(score, scoreLabel, eventId);
    }

    this.persistToFile();

    return {
      success: true,
      duplicated: false,
      event,
      totalGenerated: this.totalGenerated,
      totalAnalyzed: this.totalAnalyzed,
    };
  }

  public recordAdGenerated(category?: string, eventId?: string) {
    this.totalGenerated++;
    const todayKey = this.getTodayKey();
    const current = this.dailyGeneratedCounts.get(todayKey) || 0;
    this.dailyGeneratedCounts.set(todayKey, current + 1);

    const catLabel = category ? ` (${category.slice(0, 24)})` : "";
    this.addRecentEvent({
      id: eventId || crypto.randomUUID(),
      type: "anuncio_gerado",
      title: `Anúncio gerado com sucesso${catLabel}`,
      timestamp: Date.now(),
    });
    this.persistToFile();
  }

  public recordAdAnalyzed(score?: number, scoreLabel?: string, eventId?: string) {
    this.totalAnalyzed++;
    const todayKey = this.getTodayKey();
    const current = this.dailyAnalyzedCounts.get(todayKey) || 0;
    this.dailyAnalyzedCounts.set(todayKey, current + 1);

    const scoreInfo = typeof score === "number" ? ` (Nota ${score}/100${scoreLabel ? ` - ${scoreLabel}` : ""})` : "";
    this.addRecentEvent({
      id: eventId || crypto.randomUUID(),
      type: "anuncio_analisado",
      title: `Anúncio analisado${scoreInfo}`,
      timestamp: Date.now(),
    });
    this.persistToFile();
  }

  private addRecentEvent(event: RecentEvent) {
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > 50) {
      this.recentEvents.pop();
    }
  }

  private pruneInactiveSessions() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    for (const [id, lastSeen] of this.activeSessions.entries()) {
      if (lastSeen < fiveMinutesAgo) {
        this.activeSessions.delete(id);
      }
    }
  }

  public getMetrics(): AdminMetricsResponse {
    this.pruneInactiveSessions();

    const todayKey = this.getTodayKey();
    const todayUserSet = this.dailyUserSets.get(todayKey) || new Set();
    const activeUsersToday = todayUserSet.size;

    // Last 7 days unique active users
    const last7DaysUnique = new Set<string>();
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const set = this.dailyUserSets.get(key);
      if (set) {
        for (const u of set) {
          last7DaysUnique.add(u);
        }
      }
    }

    // Build 7-day and 30-day series
    const buildSeries = (daysCount: number): DayStat[] => {
      const series: DayStat[] = [];
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const day = d.getDate().toString().padStart(2, "0");
        const month = (d.getMonth() + 1).toString().padStart(2, "0");

        const userCount = this.dailyUserSets.get(key)?.size || 0;
        const genCount = this.dailyGeneratedCounts.get(key) || 0;
        const anaCount = this.dailyAnalyzedCounts.get(key) || 0;

        series.push({
          date: key,
          label: `${day}/${month}`,
          activeUsers: userCount,
          adsGenerated: genCount,
          adsAnalyzed: anaCount,
        });
      }
      return series;
    };

    // Build anonymous session list for online users section
    const now = Date.now();
    const activeAnonymousSessions: AnonymousSessionInfo[] = [];
    for (const [id, lastSeen] of this.activeSessions.entries()) {
      const hash = crypto.createHash("sha256").update(id).digest("hex").slice(0, 6);
      const secondsAgo = Math.max(0, Math.floor((now - lastSeen) / 1000));
      activeAnonymousSessions.push({
        idHash: `anon_${hash}`,
        lastSeenSecondsAgo: secondsAgo,
        status: secondsAgo <= 90 ? "ativo" : "recente",
      });
    }

    return {
      onlineUsers: this.activeSessions.size,
      totalUsers: this.uniqueVisitors.size,
      adsGenerated: this.totalGenerated,
      adsAnalyzed: this.totalAnalyzed,
      activeUsersToday,
      activeUsersLast7Days: last7DaysUnique.size,
      growthHistory7d: buildSeries(7),
      growthHistory30d: buildSeries(30),
      recentActivity: this.recentEvents.slice(0, 30),
      activeAnonymousSessions: activeAnonymousSessions.sort((a, b) => a.lastSeenSecondsAgo - b.lastSeenSecondsAgo),
      serverStatus: {
        status: "online",
        uptimeSeconds: Math.floor((Date.now() - this.serverStartTime) / 1000),
        aiEngine: "Gemini 2.5 Flash + Fallback Resiliente",
        metricsStorage: "Servidor Ativo em Memória (Estruturado para Persistência Cloud SQL/Firestore)",
        serverStartedAt: new Date(this.serverStartTime).toISOString(),
      },
    };
  }

  // Admin authentication management
  public isKeyConfigured(): boolean {
    const adminSecret = process.env.CREATOR_ADMIN_KEY;
    return typeof adminSecret === "string" && adminSecret.trim().length > 0;
  }

  public verifyKey(key: string): boolean {
    if (!key || typeof key !== "string") return false;
    const adminSecret = process.env.CREATOR_ADMIN_KEY;
    if (!adminSecret || adminSecret.trim().length === 0) {
      return false;
    }

    const trimmedInput = key.trim();
    const trimmedSecret = adminSecret.trim();

    const inputBuf = Buffer.from(trimmedInput, "utf-8");
    const secretBuf = Buffer.from(trimmedSecret, "utf-8");

    if (inputBuf.length !== secretBuf.length) {
      return false;
    }

    try {
      return crypto.timingSafeEqual(inputBuf, secretBuf);
    } catch {
      return false;
    }
  }

  public createSession(): string {
    const token = crypto.randomBytes(32).toString("hex");
    const now = Date.now();
    const expiresAt = now + 24 * 60 * 60 * 1000; // 24 hours
    this.adminSessions.set(token, { createdAt: now, expiresAt });
    return token;
  }

  public validateToken(token?: string): boolean {
    if (!token || typeof token !== "string") return false;
    const session = this.adminSessions.get(token);
    if (!session) return false;
    if (Date.now() > session.expiresAt) {
      this.adminSessions.delete(token);
      return false;
    }
    return true;
  }

  public revokeToken(token?: string) {
    if (token) {
      this.adminSessions.delete(token);
    }
  }
}

export const adminMetrics = new AdminMetricsTracker();
