import { LawCard } from '../types';
import { INITIAL_LAW_CARDS } from '../data/defaultDecks';

const CARDS_STORAGE_KEY = 'law_library_cards_v3';

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
