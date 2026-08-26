import { LawCard, LawDeck, NumeralSystem } from '../types';
import { sanitizeCardTextAndParagraphs, parseRawSectionNumber } from './thaiLawParser';

const DB_NAME = 'statuter_local_db_v1';
const DB_VERSION = 1;
const CARDS_STORE = 'cards';
const DECKS_STORE = 'decks';
const NUMERAL_SYSTEM_KEY = 'statutler_numeral_system_pref';

// Legacy LocalStorage keys for automatic migration
const LEGACY_CARDS_KEY = 'law_library_cards_v4';
const LEGACY_DECKS_KEY = 'law_library_decks_v4';

let dbPromise: Promise<IDBDatabase> | null = null;

// Initialize and open IndexedDB
function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(CARDS_STORE)) {
          db.createObjectStore(CARDS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(DECKS_STORE)) {
          db.createObjectStore(DECKS_STORE, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('IndexedDB open error:', request.error);
        reject(request.error);
      };
    });
  }
  return dbPromise;
}

export function loadStoredNumeralSystem(): NumeralSystem {
  try {
    const data = localStorage.getItem(NUMERAL_SYSTEM_KEY);
    if (data === 'arabic' || data === 'thai' || data === 'original') {
      return data;
    }
  } catch (e) {
    console.warn('Failed to load numeral system pref', e);
  }
  return 'arabic'; // Default to modern Arabic digits for easy study
}

export function saveStoredNumeralSystem(system: NumeralSystem): void {
  try {
    localStorage.setItem(NUMERAL_SYSTEM_KEY, system);
  } catch (e) {
    console.warn('Failed to save numeral system pref', e);
  }
}

// Synchronous legacy reader (fallback on first tick before IndexedDB loads)
export function loadStoredDecks(): LawDeck[] {
  try {
    const data = localStorage.getItem(LEGACY_DECKS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load legacy decks from localStorage', e);
  }
  return [];
}

// Synchronous legacy reader (fallback on first tick before IndexedDB loads)
export function loadStoredCards(): LawCard[] {
  try {
    const data = localStorage.getItem(LEGACY_CARDS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed
          .map(c => sanitizeCardTextAndParagraphs(c))
          .sort((a, b) => {
            const numA = typeof a.sectionRawNum === 'number' && !isNaN(a.sectionRawNum) ? a.sectionRawNum : parseRawSectionNumber(a.sectionNumber);
            const numB = typeof b.sectionRawNum === 'number' && !isNaN(b.sectionRawNum) ? b.sectionRawNum : parseRawSectionNumber(b.sectionNumber);
            return numA - numB;
          });
      }
    }
  } catch (e) {
    console.warn('Failed to load legacy cards from localStorage', e);
  }
  return [];
}

// Full async loader from IndexedDB with automatic legacy migration
export async function loadAllDataFromDB(): Promise<{ decks: LawDeck[]; cards: LawCard[] }> {
  try {
    const db = await getDB();

    // 1. Fetch decks from IndexedDB
    const decks: LawDeck[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(DECKS_STORE, 'readonly');
      const store = tx.objectStore(DECKS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    // 2. Fetch cards from IndexedDB
    const rawCards: LawCard[] = await new Promise((resolve, reject) => {
      const tx = db.transaction(CARDS_STORE, 'readonly');
      const store = tx.objectStore(CARDS_STORE);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    // If IndexedDB already has data, return it sorted
    if (decks.length > 0 || rawCards.length > 0) {
      const sanitizedCards = rawCards
        .map(c => sanitizeCardTextAndParagraphs(c))
        .sort((a, b) => {
          const numA = typeof a.sectionRawNum === 'number' && !isNaN(a.sectionRawNum) ? a.sectionRawNum : parseRawSectionNumber(a.sectionNumber);
          const numB = typeof b.sectionRawNum === 'number' && !isNaN(b.sectionRawNum) ? b.sectionRawNum : parseRawSectionNumber(b.sectionNumber);
          return numA - numB;
        });
      return { decks, cards: sanitizedCards };
    }

    // 3. Migration: If IndexedDB is empty, check legacy localStorage
    const legacyDecks = loadStoredDecks();
    const legacyCards = loadStoredCards();

    if (legacyDecks.length > 0 || legacyCards.length > 0) {
      console.log(`Migrating ${legacyDecks.length} decks and ${legacyCards.length} cards from localStorage to IndexedDB...`);
      await saveDecksAsync(legacyDecks);
      await saveCardsAsync(legacyCards);

      // Clean up legacy localStorage to free up browser quota immediately
      try {
        localStorage.removeItem(LEGACY_CARDS_KEY);
      } catch (err) {
        console.warn('Could not remove legacy cards key from localStorage:', err);
      }

      return { decks: legacyDecks, cards: legacyCards };
    }

    return { decks: [], cards: [] };
  } catch (error) {
    console.error('Failed to load data from IndexedDB, falling back to localStorage:', error);
    return {
      decks: loadStoredDecks(),
      cards: loadStoredCards(),
    };
  }
}

// Async Decks Saver (IndexedDB + safe localStorage metadata)
export async function saveDecksAsync(decks: LawDeck[]): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(DECKS_STORE, 'readwrite');
      const store = tx.objectStore(DECKS_STORE);
      store.clear();
      for (const deck of decks) {
        store.put(deck);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save decks to IndexedDB:', err);
  }

  // Also sync decks to localStorage (decks are small metadata)
  try {
    localStorage.setItem(LEGACY_DECKS_KEY, JSON.stringify(decks));
  } catch (e) {
    console.warn('Could not sync decks to localStorage:', e);
  }
}

// Async Cards Saver (IndexedDB - virtually unlimited quota)
export async function saveCardsAsync(cards: LawCard[]): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(CARDS_STORE, 'readwrite');
      const store = tx.objectStore(CARDS_STORE);
      store.clear();
      for (const card of cards) {
        store.put(card);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Failed to save cards to IndexedDB:', err);
  }

  // Try to safely clear or minimize legacy localStorage to prevent QuotaExceededError
  try {
    // If cards is small (< 50 items), we can keep a small cache, otherwise remove it to guarantee zero quota errors
    if (cards.length <= 50) {
      localStorage.setItem(LEGACY_CARDS_KEY, JSON.stringify(cards));
    } else {
      localStorage.removeItem(LEGACY_CARDS_KEY);
    }
  } catch (e) {
    // Gracefully ignore localStorage quota errors since IndexedDB safely holds all data
    try {
      localStorage.removeItem(LEGACY_CARDS_KEY);
    } catch (_) {}
  }
}

// Debounced save callers for React state sync
let saveCardsTimeout: any = null;
export function saveStoredCards(cards: LawCard[]): void {
  if (saveCardsTimeout) clearTimeout(saveCardsTimeout);
  saveCardsTimeout = setTimeout(() => {
    saveCardsAsync(cards);
  }, 100);
}

let saveDecksTimeout: any = null;
export function saveStoredDecks(decks: LawDeck[]): void {
  if (saveDecksTimeout) clearTimeout(saveDecksTimeout);
  saveDecksTimeout = setTimeout(() => {
    saveDecksAsync(decks);
  }, 100);
}

// Clear all local database records
export async function clearAllLocalDatabase(): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction([CARDS_STORE, DECKS_STORE], 'readwrite');
    tx.objectStore(CARDS_STORE).clear();
    tx.objectStore(DECKS_STORE).clear();
  } catch (err) {
    console.error('Error clearing IndexedDB:', err);
  }

  try {
    localStorage.removeItem(LEGACY_CARDS_KEY);
    localStorage.removeItem(LEGACY_DECKS_KEY);
  } catch (e) {
    console.warn('Error clearing localStorage:', e);
  }
}

// Download single deck with its cards as JSON file
export function exportDeckToJson(deck: LawDeck, cards: LawCard[]): void {
  const deckCards = cards.filter(c => c.deckId === deck.id);
  const data = {
    version: '1.0',
    type: 'law_deck_export',
    exportedAt: new Date().toISOString(),
    deck,
    cards: deckCards,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `deck_${deck.shortName || deck.id}_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Download all decks & cards as full backup JSON
export function exportAllDataToJson(decks: LawDeck[], cards: LawCard[]): void {
  const data = {
    version: '1.0',
    type: 'law_full_backup',
    exportedAt: new Date().toISOString(),
    totalDecks: decks.length,
    totalCards: cards.length,
    decks,
    cards,
  };
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `statuter_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
