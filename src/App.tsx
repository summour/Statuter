import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DeckGrid } from './components/DeckGrid';
import { DeckReader } from './components/DeckReader';
import { AddSectionModal } from './components/AddSectionModal';
import { ImportLawModal } from './components/ImportLawModal';
import { LawDeck, LawCard } from './types';
import { LAW_DECKS, INITIAL_LAW_CARDS } from './data/defaultDecks';
import { loadStoredCards, saveStoredCards } from './utils/storage';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [cards, setCards] = useState<LawCard[]>(() => loadStoredCards());
  const [decks] = useState<LawDeck[]>(LAW_DECKS);
  const [selectedDeck, setSelectedDeck] = useState<LawDeck | 'all' | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [activeCardId, setActiveCardId] = useState<string | undefined>(undefined);
  const [importNotification, setImportNotification] = useState<{ message: string; deckId: string } | null>(null);

  // Sync cards changes to localStorage
  useEffect(() => {
    saveStoredCards(cards);
  }, [cards]);

  // Save new single card
  const handleSaveCard = useCallback((newCard: LawCard) => {
    setCards(prev => [newCard, ...prev]);
  }, []);

  // Handle Batch Import Success
  const handleBatchImport = useCallback((
    newCards: LawCard[], 
    targetDeck: LawDeck, 
    duplicateAction: 'replace' | 'skip' | 'keep-both'
  ) => {
    setCards(prevCards => {
      let updatedList = [...prevCards];

      if (duplicateAction === 'replace') {
        // Remove existing cards that match sectionNumber in the same deck
        const newSecNumbers = new Set(newCards.map(c => c.sectionNumber.trim()));
        updatedList = updatedList.filter(c => !(c.deckId === targetDeck.id && newSecNumbers.has(c.sectionNumber.trim())));
        updatedList = [...newCards, ...updatedList];
      } else if (duplicateAction === 'skip') {
        const existingSecNumbers = new Set(
          updatedList.filter(c => c.deckId === targetDeck.id).map(c => c.sectionNumber.trim())
        );
        const filteredNew = newCards.filter(c => !existingSecNumbers.has(c.sectionNumber.trim()));
        updatedList = [...filteredNew, ...updatedList];
      } else {
        // keep-both
        updatedList = [...newCards, ...updatedList];
      }

      // Sort by sectionRawNum
      return updatedList.sort((a, b) => a.sectionRawNum - b.sectionRawNum);
    });

    setImportNotification({
      message: `นำเข้า ${newCards.length} มาตรา สู่สำรับ "${targetDeck.name}" เรียบร้อยแล้ว`,
      deckId: targetDeck.id,
    });

    // Auto-dismiss notification
    setTimeout(() => {
      setImportNotification(null);
    }, 6000);
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
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onResetData={handleResetData}
        totalCardsCount={cards.length}
        totalDecksCount={decks.length}
      />

      {/* Floating Notification for Import */}
      {importNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-zinc-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold">{importNotification.message}</p>
          </div>
          <button
            onClick={() => {
              const target = decks.find(d => d.id === importNotification.deckId);
              if (target) setSelectedDeck(target);
              setImportNotification(null);
            }}
            className="ml-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-emerald-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            เปิดอ่านทันที
          </button>
        </div>
      )}

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

      {/* Bulk Law Import Modal */}
      <ImportLawModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        decks={decks}
        existingCards={cards}
        onImportSuccess={handleBatchImport}
        defaultDeckId={selectedDeck && selectedDeck !== 'all' ? selectedDeck.id : undefined}
      />
    </div>
  );
}

export default App;

