import { LawCard, LawDeck, NumeralSystem } from '../types';
import { LAW_DECKS, INITIAL_LAW_CARDS } from '../data/defaultDecks';

const CARDS_STORAGE_KEY = 'law_library_cards_v4';
const DECKS_STORAGE_KEY = 'law_library_decks_v4';
const NUMERAL_SYSTEM_KEY = 'statutler_numeral_system_pref';

export function loadStoredNumeralSystem(): NumeralSystem {
  try {
    const data = localStorage.getItem(NUMERAL_SYSTEM_KEY);
    if (data === 'arabic' || data === 'thai' || data === 'original') {
      return data;
    }
  } catch (e) {
    console.error('Failed to load numeral system pref', e);
  }
  return 'arabic'; // Default to modern Arabic digits for easy study
}

export function saveStoredNumeralSystem(system: NumeralSystem): void {
  try {
    localStorage.setItem(NUMERAL_SYSTEM_KEY, system);
  } catch (e) {
    console.error('Failed to save numeral system pref', e);
  }
}

export function loadStoredDecks(): LawDeck[] {
  try {
    const data = localStorage.getItem(DECKS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load decks from storage', e);
  }
  return [];
}

export function saveStoredDecks(decks: LawDeck[]): void {
  try {
    localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks));
  } catch (e) {
    console.error('Failed to save decks to storage', e);
  }
}

export function loadStoredCards(): LawCard[] {
  try {
    const data = localStorage.getItem(CARDS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load cards from storage', e);
  }
  return [];
}

export function saveStoredCards(cards: LawCard[]): void {
  try {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save cards to storage', e);
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
  a.download = `law_library_backup_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

