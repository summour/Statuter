import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DeckGrid } from './components/DeckGrid';
import { DeckReader } from './components/DeckReader';
import { AddSectionModal } from './components/AddSectionModal';
import { LawDeck, LawCard } from './types';
import { LAW_DECKS, INITIAL_LAW_CARDS } from './data/defaultDecks';
import { loadStoredCards, saveStoredCards } from './utils/storage';

export function App() {
  const [cards, setCards] = useState<LawCard[]>(() => loadStoredCards());
  const [decks] = useState<LawDeck[]>(LAW_DECKS);
  const [selectedDeck, setSelectedDeck] = useState<LawDeck | 'all' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [activeCardId, setActiveCardId] = useState<string | undefined>(undefined);

  // Sync cards changes to localStorage
  useEffect(() => {
    saveStoredCards(cards);
  }, [cards]);

  // Save new card
  const handleSaveCard = useCallback((newCard: LawCard) => {
    setCards(prev => [newCard, ...prev]);
  }, []);

  // Reset to default cards
  const handleResetData = useCallback(() => {
    setCards(INITIAL_LAW_CARDS);
    saveStoredCards(INITIAL_LAW_CARDS);
  }, []);

  // Select card directly from search
  const handleSelectCardDirectly = (card: LawCard) => {
    const targetDeck = decks.find(d => d.id === card.deckId) || 'all';
    setSelectedDeck(targetDeck);
    setActiveCardId(card.id);
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111111] flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedDeck={selectedDeck === 'all' ? null : selectedDeck}
        onSelectDeck={() => {
          setSelectedDeck(null);
          setActiveCardId(undefined);
          setSearchQuery('');
        }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onResetData={handleResetData}
        totalCardsCount={cards.length}
        totalDecksCount={decks.length}
      />

      {/* Main View */}
      <main className="flex-1 w-full pb-12">
        {selectedDeck === null ? (
          /* Library Deck Shelves */
          <DeckGrid
            decks={decks}
            cards={cards}
            onSelectDeck={(deck) => {
              setSelectedDeck(deck);
              setActiveCardId(undefined);
              setSearchQuery('');
            }}
            searchQuery={searchQuery}
            onSelectCardDirectly={handleSelectCardDirectly}
          />
        ) : (
          /* Deck Section Reader */
          <DeckReader
            deck={selectedDeck}
            cards={cards}
            onBackToLibrary={() => {
              setSelectedDeck(null);
              setActiveCardId(undefined);
            }}
            initialCardId={activeCardId}
          />
        )}
      </main>

      {/* Add New Section Modal */}
      <AddSectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaveCard={handleSaveCard}
        decks={decks}
        defaultDeckId={selectedDeck && selectedDeck !== 'all' ? selectedDeck.id : undefined}
      />
    </div>
  );
}

export default App;
