import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DeckGrid } from './components/DeckGrid';
import { DeckOverview } from './components/DeckOverview';
import { DeckReader } from './components/DeckReader';
import { AddSectionModal } from './components/AddSectionModal';
import { CardEditModal } from './components/CardEditModal';
import { ImportLawModal } from './components/ImportLawModal';
import { DeckEditModal } from './components/DeckEditModal';
import { DeleteDeckModal } from './components/DeleteDeckModal';
import { IOSDock, TabType } from './components/IOSDock';
import { SettingsView } from './components/SettingsView';
import { LawDeck, LawCard, NumeralSystem } from './types';
import { LAW_DECKS, INITIAL_LAW_CARDS } from './data/defaultDecks';
import { parseRawSectionNumber } from './utils/thaiLawParser';
import { 
  loadStoredCards, 
  saveStoredCards, 
  loadStoredDecks, 
  saveStoredDecks,
  loadStoredNumeralSystem,
  saveStoredNumeralSystem,
  loadAllDataFromDB,
  clearAllLocalDatabase
} from './utils/storage';
import { CheckCircle2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [cards, setCards] = useState<LawCard[]>(() => loadStoredCards());
  const [decks, setDecks] = useState<LawDeck[]>(() => loadStoredDecks());
  const [numeralSystem, setNumeralSystem] = useState<NumeralSystem>(() => loadStoredNumeralSystem());
  const [selectedDeck, setSelectedDeck] = useState<LawDeck | 'all' | null>(null);
  const [deckViewMode, setDeckViewMode] = useState<'overview' | 'reader'>('overview');
  const [activeStructureFilter, setActiveStructureFilter] = useState<string>('all');
  const [readerInitialViewMode, setReaderInitialViewMode] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCardId, setActiveCardId] = useState<string | undefined>(undefined);
  const [importNotification, setImportNotification] = useState<{ message: string; deckId?: string } | null>(null);

  // Initialize and load full persistent data from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    loadAllDataFromDB().then(({ decks: dbDecks, cards: dbCards }) => {
      if (isMounted) {
        if (dbDecks.length > 0) setDecks(dbDecks);
        if (dbCards.length > 0) setCards(dbCards);
      }
    }).catch(err => {
      console.warn('Could not load from IndexedDB:', err);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isCardEditOpen, setIsCardEditOpen] = useState<boolean>(false);
  const [editingCard, setEditingCard] = useState<LawCard | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isDeckEditOpen, setIsDeckEditOpen] = useState<boolean>(false);
  const [editingDeck, setEditingDeck] = useState<LawDeck | null>(null);
  const [isDeleteDeckOpen, setIsDeleteDeckOpen] = useState<boolean>(false);
  const [deckToDelete, setDeckToDelete] = useState<LawDeck | null>(null);
  const [preselectedDeckId, setPreselectedDeckId] = useState<string | undefined>(undefined);

  // Sync cards changes to localStorage
  useEffect(() => {
    saveStoredCards(cards);
  }, [cards]);

  // Sync decks changes to localStorage
  useEffect(() => {
    saveStoredDecks(decks);
  }, [decks]);

  // Sync numeral system preference to localStorage
  useEffect(() => {
    saveStoredNumeralSystem(numeralSystem);
  }, [numeralSystem]);

  // Helper to ensure cards remain in exact Thai statutory sequence
  const sortLawCards = useCallback((cardList: LawCard[]): LawCard[] => {
    return [...cardList].sort((a, b) => {
      const numA = typeof a.sectionRawNum === 'number' && !isNaN(a.sectionRawNum) ? a.sectionRawNum : parseRawSectionNumber(a.sectionNumber);
      const numB = typeof b.sectionRawNum === 'number' && !isNaN(b.sectionRawNum) ? b.sectionRawNum : parseRawSectionNumber(b.sectionNumber);
      if (numA !== numB) return numA - numB;
      return a.sectionNumber.localeCompare(b.sectionNumber, 'th');
    });
  }, []);

  // Save new single card
  const handleSaveCard = useCallback((newCard: LawCard) => {
    setCards(prev => sortLawCards([newCard, ...prev]));
  }, [sortLawCards]);

  // Update existing single card
  const handleUpdateCard = useCallback((updatedCard: LawCard) => {
    setCards(prevCards => {
      const updated = prevCards.map(c => c.id === updatedCard.id ? updatedCard : c);
      return sortLawCards(updated);
    });
    setImportNotification({
      message: `บันทึกการแก้ไข ${updatedCard.sectionNumber} สำเร็จ`,
    });
    setTimeout(() => setImportNotification(null), 3000);
  }, [sortLawCards]);

  // Delete single card
  const handleDeleteCard = useCallback((cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
  }, []);

  // Save new or edited Deck
  const handleSaveDeck = useCallback((deckToSave: LawDeck) => {
    setDecks(prevDecks => {
      const existsIndex = prevDecks.findIndex(d => d.id === deckToSave.id);
      if (existsIndex >= 0) {
        // Update existing deck
        const updated = [...prevDecks];
        updated[existsIndex] = deckToSave;
        return updated;
      } else {
        // Add new deck
        return [...prevDecks, deckToSave];
      }
    });

    // Also update any cards associated with this deck if name or shortName changed
    setCards(prevCards => {
      return prevCards.map(c => {
        if (c.deckId === deckToSave.id) {
          return {
            ...c,
            deckName: deckToSave.name,
            deckShortName: deckToSave.shortName,
          };
        }
        return c;
      });
    });

    // If current selectedDeck is this deck, update it
    setSelectedDeck(prev => {
      if (prev && prev !== 'all' && prev.id === deckToSave.id) {
        return deckToSave;
      }
      return prev;
    });

    setImportNotification({
      message: `บันทึกสำรับ "${deckToSave.name}" เรียบร้อยแล้ว`,
      deckId: deckToSave.id,
    });
    setTimeout(() => setImportNotification(null), 4000);
  }, []);

  // Delete Deck with card management action
  const handleDeleteDeckConfirm = useCallback((
    deckId: string, 
    action: 'delete-cards' | 'move-cards', 
    targetDeckId?: string
  ) => {
    const deletedDeck = decks.find(d => d.id === deckId);
    
    // Remove deck from decks state
    setDecks(prev => prev.filter(d => d.id !== deckId));

    // Handle cards inside this deck
    setCards(prevCards => {
      if (action === 'delete-cards') {
        return prevCards.filter(c => c.deckId !== deckId);
      } else if (action === 'move-cards' && targetDeckId) {
        const targetDeck = decks.find(d => d.id === targetDeckId);
        return prevCards.map(c => {
          if (c.deckId === deckId) {
            return {
              ...c,
              deckId: targetDeckId,
              deckName: targetDeck?.name || c.deckName,
              deckShortName: targetDeck?.shortName || c.deckShortName,
            };
          }
          return c;
        });
      }
      return prevCards;
    });

    // If currently viewing the deleted deck, return to library
    setSelectedDeck(prev => {
      if (prev && prev !== 'all' && prev.id === deckId) {
        return null;
      }
      return prev;
    });

    setImportNotification({
      message: `ลบสำรับ "${deletedDeck?.name || deckId}" สำเร็จ`,
    });
    setTimeout(() => setImportNotification(null), 4000);
  }, [decks]);

  // Handle Batch Import Success
  const handleBatchImport = useCallback((
    newCards: LawCard[], 
    targetDeck: LawDeck, 
    duplicateAction: 'replace' | 'skip' | 'keep-both'
  ) => {
    // Ensure targetDeck exists in decks
    setDecks(prevDecks => {
      if (!prevDecks.some(d => d.id === targetDeck.id)) {
        return [...prevDecks, targetDeck];
      }
      return prevDecks;
    });

    setCards(prevCards => {
      let updatedList = [...prevCards];

      if (duplicateAction === 'replace') {
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
        updatedList = [...newCards, ...updatedList];
      }

      return sortLawCards(updatedList);
    });

    setImportNotification({
      message: `นำเข้า ${newCards.length} มาตรา สู่สำรับ "${targetDeck.name}" เรียบร้อยแล้ว`,
      deckId: targetDeck.id,
    });

    setTimeout(() => setImportNotification(null), 6000);
  }, [sortLawCards]);

  // Handle Full JSON Backup Import or Single Deck Import
  const handleImportBackup = useCallback((importedDecks: LawDeck[], importedCards: LawCard[]) => {
    // Merge Decks
    setDecks(prevDecks => {
      const deckMap = new Map<string, LawDeck>();
      prevDecks.forEach(d => deckMap.set(d.id, d));
      importedDecks.forEach(d => deckMap.set(d.id, d));
      return Array.from(deckMap.values());
    });

    // Merge Cards
    setCards(prevCards => {
      const cardMap = new Map<string, LawCard>();
      prevCards.forEach(c => cardMap.set(c.id, c));
      importedCards.forEach(c => cardMap.set(c.id, c));
      return sortLawCards(Array.from(cardMap.values()));
    });

    setImportNotification({
      message: `นำเข้าข้อมูลสำรอง ${importedDecks.length} สำรับ และ ${importedCards.length} มาตรา เรียบร้อยแล้ว`,
    });
    setTimeout(() => setImportNotification(null), 6000);
  }, [sortLawCards]);

  // Reset to default cards & decks
  const handleResetData = useCallback(() => {
    setDecks([]);
    setCards([]);
    clearAllLocalDatabase();
    setSelectedDeck(null);
    setActiveCardId(undefined);
  }, []);

  // Select card directly from search
  const handleSelectCardDirectly = (card: LawCard) => {
    const targetDeck = decks.find(d => d.id === card.deckId) || 'all';
    setSelectedDeck(targetDeck);
    setActiveCardId(card.id);
    setActiveStructureFilter('all');
    setReaderInitialViewMode('card');
    setDeckViewMode('reader');
    setSearchQuery('');
  };

  // Open Add modal for specific deck
  const handleOpenAddSectionToDeck = (deckId?: string) => {
    setPreselectedDeckId(deckId);
    setIsAddModalOpen(true);
  };

  // Open Edit Deck Modal
  const handleOpenEditDeck = (deck: LawDeck) => {
    setEditingDeck(deck);
    setIsDeckEditOpen(true);
  };

  // Open Delete Deck Modal
  const handleOpenDeleteDeck = (deck: LawDeck) => {
    setDeckToDelete(deck);
    setIsDeleteDeckOpen(true);
  };

  // Open Create New Deck Modal
  const handleOpenCreateDeck = () => {
    setEditingDeck(null);
    setIsDeckEditOpen(true);
  };

  // Open Edit Card Modal
  const handleOpenEditCard = useCallback((card: LawCard) => {
    setEditingCard(card);
    setIsCardEditOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111111] flex flex-col font-sans selection:bg-black selection:text-white">
      {/* Minimal Header on Home */}
      {activeTab === 'home' && selectedDeck === null && (
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedDeck={null}
          onSelectDeck={() => {
            setSelectedDeck(null);
            setActiveCardId(undefined);
            setSearchQuery('');
          }}
          onOpenAddModal={() => {
            setPreselectedDeckId(undefined);
            setIsAddModalOpen(true);
          }}
          onOpenImportModal={() => setIsImportModalOpen(true)}
          totalCardsCount={cards.length}
          totalDecksCount={decks.length}
          numeralSystem={numeralSystem}
        />
      )}

      {/* Floating Notification */}
      {importNotification && (
        <div className="fixed bottom-24 right-6 z-50 bg-zinc-900 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-zinc-700 flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-semibold">{importNotification.message}</p>
          </div>
          {importNotification.deckId && (
            <button
              onClick={() => {
                const target = decks.find(d => d.id === importNotification.deckId);
                if (target) {
                  setSelectedDeck(target);
                  setDeckViewMode('overview');
                  setActiveTab('home');
                }
                setImportNotification(null);
              }}
              className="ml-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-emerald-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              เปิดดูสารบัญ
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-28">
        {activeTab === 'home' ? (
          selectedDeck === null ? (
            /* Library Deck Shelves */
            <DeckGrid
              decks={decks}
              cards={cards}
              onSelectDeck={(deck) => {
                setSelectedDeck(deck);
                setDeckViewMode('overview');
                setActiveCardId(undefined);
                setActiveStructureFilter('all');
                setSearchQuery('');
              }}
              searchQuery={searchQuery}
              onSelectCardDirectly={handleSelectCardDirectly}
              onOpenCreateDeck={handleOpenCreateDeck}
              onOpenEditDeck={handleOpenEditDeck}
              onOpenDeleteDeck={handleOpenDeleteDeck}
              onOpenAddSectionToDeck={handleOpenAddSectionToDeck}
              onOpenDeckManager={() => setActiveTab('settings')}
              numeralSystem={numeralSystem}
            />
          ) : deckViewMode === 'overview' ? (
            /* Screen 1: Deck Table of Contents & Structure Overview */
            <DeckOverview
              deck={selectedDeck}
              cards={cards}
              onBackToLibrary={() => {
                setSelectedDeck(null);
                setActiveCardId(undefined);
              }}
              onStartReading={(structureFilter = 'all', startCardId, initialMode = 'card') => {
                setActiveStructureFilter(structureFilter);
                setActiveCardId(startCardId);
                setReaderInitialViewMode(initialMode);
                setDeckViewMode('reader');
              }}
              onOpenAddSectionToDeck={handleOpenAddSectionToDeck}
              onOpenImportModal={(deckId) => {
                if (deckId) setPreselectedDeckId(deckId);
                setIsImportModalOpen(true);
              }}
              onOpenEditDeck={handleOpenEditDeck}
              numeralSystem={numeralSystem}
            />
          ) : (
            /* Screen 2: Clean, Unobstructed Statute Card Reader */
            <DeckReader
              deck={selectedDeck}
              cards={cards}
              onBackToLibrary={() => {
                setDeckViewMode('overview');
                setActiveCardId(undefined);
              }}
              initialCardId={activeCardId}
              initialStructureFilter={activeStructureFilter}
              initialViewMode={readerInitialViewMode}
              onOpenAddSectionToDeck={handleOpenAddSectionToDeck}
              onOpenImportModal={(deckId) => {
                if (deckId) setPreselectedDeckId(deckId);
                setIsImportModalOpen(true);
              }}
              onOpenEditDeck={handleOpenEditDeck}
              onDeleteCard={handleDeleteCard}
              onOpenEditCard={handleOpenEditCard}
              numeralSystem={numeralSystem}
              onNumeralSystemChange={setNumeralSystem}
            />
          )
        ) : (
          /* iOS Settings Tab */
          <SettingsView
            numeralSystem={numeralSystem}
            onNumeralSystemChange={setNumeralSystem}
            decks={decks}
            cards={cards}
            onOpenCreateDeck={handleOpenCreateDeck}
            onOpenEditDeck={handleOpenEditDeck}
            onOpenDeleteDeck={handleOpenDeleteDeck}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onImportBackup={handleImportBackup}
            onResetData={handleResetData}
            onSelectDeckToRead={(deck) => {
              setSelectedDeck(deck);
              setDeckViewMode('overview');
              setActiveCardId(undefined);
              setActiveTab('home');
            }}
          />
        )}
      </main>

      {/* iOS 26 Floating Dock */}
      <IOSDock
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'home' && activeTab === 'home' && selectedDeck) {
            setSelectedDeck(null);
          }
        }}
        cardsCount={cards.length}
        decksCount={decks.length}
      />

      {/* Add New Section Modal */}
      <AddSectionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setPreselectedDeckId(undefined);
        }}
        onSaveCard={handleSaveCard}
        decks={decks}
        defaultDeckId={preselectedDeckId || (selectedDeck && selectedDeck !== 'all' ? selectedDeck.id : undefined)}
      />

      {/* Edit Section Card Modal */}
      <CardEditModal
        isOpen={isCardEditOpen}
        onClose={() => {
          setIsCardEditOpen(false);
          setEditingCard(null);
        }}
        onSaveCard={handleUpdateCard}
        card={editingCard}
        decks={decks}
      />

      {/* Bulk Law Import Modal */}
      <ImportLawModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setPreselectedDeckId(undefined);
        }}
        decks={decks}
        existingCards={cards}
        onImportSuccess={handleBatchImport}
        defaultDeckId={preselectedDeckId || (selectedDeck && selectedDeck !== 'all' ? selectedDeck.id : undefined)}
      />

      {/* Deck Edit / Create Modal */}
      <DeckEditModal
        isOpen={isDeckEditOpen}
        onClose={() => {
          setIsDeckEditOpen(false);
          setEditingDeck(null);
        }}
        onSaveDeck={handleSaveDeck}
        editingDeck={editingDeck}
      />

      {/* Delete Deck Confirmation Modal */}
      <DeleteDeckModal
        isOpen={isDeleteDeckOpen}
        onClose={() => {
          setIsDeleteDeckOpen(false);
          setDeckToDelete(null);
        }}
        deck={deckToDelete}
        cards={cards}
        allDecks={decks}
        onConfirmDelete={handleDeleteDeckConfirm}
      />
    </div>
  );
}

export default App;
