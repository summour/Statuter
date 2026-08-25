import { AppSettings, LawCard, ReviewLog, UserStats } from '../types';
import { INITIAL_LAW_CARDS } from '../data/defaultDecks';
import { getTodayString } from './srs';

const STORAGE_KEYS = {
  CARDS: 'legal_anki_cards_v2',
  STATS: 'legal_anki_stats_v1',
  SETTINGS: 'legal_anki_settings_v1',
};

export const DEFAULT_SETTINGS: AppSettings = {
  autoSpeakOnFlip: false,
  speechRate: 0.95,
  vibrateOnTap: true,
  theme: 'white',
  dailyReviewGoal: 20,
  shuffleCards: true,
};

export function loadStoredCards(): LawCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    if (!raw) {
      // Clean start with empty list as user requested
      return INITIAL_LAW_CARDS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (e) {
    console.error('Failed to load cards from storage', e);
    return [];
  }
}

export function saveCards(cards: LawCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save cards', e);
  }
}

export function loadUserStats(): UserStats {
  const today = getTodayString();
  const defaultStats: UserStats = {
    dailyStreak: 1,
    lastStudyDate: today,
    totalReviewsToday: 0,
    dailyGoal: 20,
    reviewLogs: [],
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATS);
    if (!raw) return defaultStats;
    const parsed: UserStats = JSON.parse(raw);

    // Calculate streak
    if (parsed.lastStudyDate) {
      const lastDate = new Date(parsed.lastStudyDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (parsed.lastStudyDate !== today) {
        if (diffDays === 1) {
          // Continuous day
          parsed.dailyStreak = (parsed.dailyStreak || 0) + 1;
        } else if (diffDays > 1) {
          // Broken streak
          parsed.dailyStreak = 1;
        }
        parsed.totalReviewsToday = 0;
        parsed.lastStudyDate = today;
      }
    } else {
      parsed.lastStudyDate = today;
      parsed.dailyStreak = 1;
      parsed.totalReviewsToday = 0;
    }

    return parsed;
  } catch (e) {
    console.error('Failed to load stats', e);
    return defaultStats;
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save stats', e);
  }
}

export function logCardReview(
  card: LawCard,
  grade: string,
  mode: string,
  currentStats: UserStats
): UserStats {
  const today = getTodayString();
  const newLog: ReviewLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    cardId: card.id,
    sectionNumber: card.sectionNumber,
    codeCategory: card.codeCategory,
    grade: grade as any,
    timestamp: new Date().toISOString(),
    studyMode: mode as any,
  };

  // Keep last 200 logs
  const updatedLogs = [newLog, ...(currentStats.reviewLogs || [])].slice(0, 200);

  const updatedStats: UserStats = {
    ...currentStats,
    lastStudyDate: today,
    totalReviewsToday: (currentStats.totalReviewsToday || 0) + 1,
    reviewLogs: updatedLogs,
  };

  saveUserStats(updatedStats);
  return updatedStats;
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEYS.CARDS);
  localStorage.removeItem('legal_anki_cards_v1');
  localStorage.removeItem(STORAGE_KEYS.STATS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
}

export function clearAllCards(): void {
  localStorage.removeItem(STORAGE_KEYS.CARDS);
  localStorage.removeItem('legal_anki_cards_v1');
}

// Aliases for convenient importing
export const loadCardsFromStorage = loadStoredCards;
export const saveCardsToStorage = saveCards;
export const loadStatsFromStorage = loadUserStats;
export const saveStatsToStorage = saveUserStats;
export const loadSettingsFromStorage = loadSettings;
export const saveSettingsToStorage = saveSettings;
