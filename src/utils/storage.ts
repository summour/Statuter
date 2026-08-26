import { LawCard, LawDeck } from '../types';
import { LAW_DECKS, INITIAL_LAW_CARDS } from '../data/defaultDecks';

const CARDS_STORAGE_KEY = 'law_library_cards_v3';
const DECKS_STORAGE_KEY = 'law_library_decks_v3';

export function loadStoredDecks(): LawDeck[] {
  try {
    const data = localStorage.getItem(DECKS_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load decks from storage', e);
  }
  return LAW_DECKS.map(d => ({ ...d, isDefault: true }));
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
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load cards from storage', e);
  }
  return INITIAL_LAW_CARDS;
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

