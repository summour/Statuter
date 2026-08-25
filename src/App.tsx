import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { DeckDashboard } from './components/DeckDashboard';
import { FlashcardStudy } from './components/FlashcardStudy';
import { ClozeStudy } from './components/ClozeStudy';
import { ElementsBreakdown } from './components/ElementsBreakdown';
import { ReciteTest } from './components/ReciteTest';
import { StatuteBrowser } from './components/StatuteBrowser';
import { CardEditorModal } from './components/CardEditorModal';
import { CardDetailModal } from './components/CardDetailModal';
import { StatsModal } from './components/StatsModal';
import { SettingsModal } from './components/SettingsModal';
import { 
  CardGrade, 
  LawCard, 
  LawCodeCategory, 
  StudyMode, 
  UserStats, 
  AppSettings 
} from './types';
import { 
  loadStoredCards, 
  saveCards, 
  loadUserStats, 
  saveUserStats, 
  logCardReview, 
  loadSettings, 
  saveSettings 
} from './utils/storage';
import { calculateNextSRS, isCardDue } from './utils/srs';
import { INITIAL_LAW_CARDS } from './data/defaultDecks';
import { 
  Layers, 
  Sparkles, 
  Search, 
  BookOpen, 
  FileText,
  Home,
  CheckCircle2
} from 'lucide-react';

export function App() {
  const [cards, setCards] = useState<LawCard[]>(() => loadStoredCards());
  const [stats, setStats] = useState<UserStats>(() => loadUserStats());
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());

  const [currentMode, setCurrentMode] = useState<StudyMode | 'dashboard'>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<LawCodeCategory | 'all'>('all');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<LawCard | null>(null);
  const [viewingCard, setViewingCard] = useState<LawCard | null>(null);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync cards & stats changes
  useEffect(() => {
    saveCards(cards);
  }, [cards]);

  useEffect(() => {
    saveUserStats(stats);
  }, [stats]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Filter cards to study based on selected category
  const activeStudyCards = useMemo(() => {
    let pool = cards.filter(c => selectedCategory === 'all' || c.codeCategory === selectedCategory);
    if (currentMode === 'flashcard') {
      // Prioritize due cards first
      const due = pool.filter(c => isCardDue(c.srs));
      const notDue = pool.filter(c => !isCardDue(c.srs));
      pool = [...due, ...notDue];
    }
    return pool;
  }, [cards, selectedCategory, currentMode]);

  // Overall due count
  const totalDueCount = useMemo(() => {
    return cards.filter(c => isCardDue(c.srs)).length;
  }, [cards]);

  // Handle grading a card in Anki SRS mode
  const handleGradeCard = (card: LawCard, grade: CardGrade) => {
    const nextSRS = calculateNextSRS(card.srs, grade);
    const updatedCard: LawCard = {
      ...card,
      srs: nextSRS,
      updatedAt: new Date().toISOString(),
    };

    setCards(prev => prev.map(c => (c.id === card.id ? updatedCard : c)));
    const updatedStats = logCardReview(updatedCard, grade, currentMode as StudyMode, stats);
    setStats(updatedStats);
  };

  // Toggle star
  const handleToggleStar = (cardId: string) => {
    setCards(prev =>
      prev.map(c => (c.id === cardId ? { ...c, isStarred: !c.isStarred } : c))
    );
    if (viewingCard && viewingCard.id === cardId) {
      setViewingCard(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
    }
  };

  // Save (Add / Update) card
  const handleSaveCard = (cardToSave: LawCard) => {
    setCards(prev => {
      const exists = prev.some(c => c.id === cardToSave.id);
      if (exists) {
        return prev.map(c => (c.id === cardToSave.id ? cardToSave : c));
      } else {
        return [cardToSave, ...prev];
      }
    });
    setEditingCard(null);
  };

  // Delete card
  const handleDeleteCard = (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    if (viewingCard?.id === cardId) setViewingCard(null);
  };

  // Start study with specified category & mode
  const handleStartStudy = (category: LawCodeCategory | 'all', mode: StudyMode) => {
    setSelectedCategory(category);
    setCurrentMode(mode);
  };

  const handleStudySpecificCard = (card: LawCard) => {
    setSelectedCategory(card.codeCategory);
    setCurrentMode('flashcard');
  };

  const handleClearAllCards = () => {
    setCards([]);
    saveCards([]);
  };

  const handleResetToDefault = () => {
    setCards(INITIAL_LAW_CARDS);
    saveCards(INITIAL_LAW_CARDS);
  };

  const handleImportCards = (imported: LawCard[]) => {
    setCards(imported);
    saveCards(imported);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111111] flex flex-col font-sans selection:bg-black selection:text-white pb-20 md:pb-8">
      {/* iOS 26 Dynamic Top Navigation */}
      <Header
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        streak={stats.dailyStreak}
        dueCount={totalDueCount}
        onOpenAddCard={() => {
          setEditingCard(null);
          setIsAddOpen(true);
        }}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full">
        {currentMode === 'dashboard' && (
          <DeckDashboard
            cards={cards}
            onStartStudy={handleStartStudy}
            onSelectCategory={cat => setSelectedCategory(cat)}
            onOpenAddModal={() => {
              setEditingCard(null);
              setIsAddOpen(true);
            }}
            onToggleStar={handleToggleStar}
            onOpenCardDetail={c => setViewingCard(c)}
          />
        )}

        {currentMode === 'flashcard' && (
          <FlashcardStudy
            cards={activeStudyCards}
            onGradeCard={handleGradeCard}
            onToggleStar={handleToggleStar}
            onFinishStudy={() => setCurrentMode('dashboard')}
            onBackToDashboard={() => setCurrentMode('dashboard')}
            speechRate={settings.speechRate}
          />
        )}

        {currentMode === 'cloze' && (
          <ClozeStudy
            cards={activeStudyCards}
            onBackToDashboard={() => setCurrentMode('dashboard')}
            onToggleStar={handleToggleStar}
          />
        )}

        {currentMode === 'elements' && (
          <ElementsBreakdown
            cards={activeStudyCards}
            onBackToDashboard={() => setCurrentMode('dashboard')}
          />
        )}

        {currentMode === 'recite_test' && (
          <ReciteTest
            cards={activeStudyCards}
            onBackToDashboard={() => setCurrentMode('dashboard')}
          />
        )}

        {currentMode === 'browse' && (
          <StatuteBrowser
            cards={cards}
            onToggleStar={handleToggleStar}
            onOpenCardDetail={c => setViewingCard(c)}
            onOpenAddModal={() => {
              setEditingCard(null);
              setIsAddOpen(true);
            }}
            onStudySpecificCard={handleStudySpecificCard}
          />
        )}
      </main>

      {/* Mobile iOS 26 Tab Bar */}
      <nav id="mobile-tab-bar" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-zinc-200/80 px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setCurrentMode('dashboard')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
            currentMode === 'dashboard' ? 'text-zinc-950 font-bold' : 'text-zinc-600'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">หน้าแรก</span>
        </button>

        <button
          onClick={() => setCurrentMode('flashcard')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all relative cursor-pointer ${
            currentMode === 'flashcard' ? 'text-zinc-950 font-bold' : 'text-zinc-600'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px]">บัตรคำ</span>
          {totalDueCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-black" />
          )}
        </button>

        <button
          onClick={() => setCurrentMode('cloze')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
            currentMode === 'cloze' ? 'text-zinc-950 font-bold' : 'text-zinc-600'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px]">เติมคำ</span>
        </button>

        <button
          onClick={() => setCurrentMode('recite_test')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
            currentMode === 'recite_test' ? 'text-zinc-950 font-bold' : 'text-zinc-600'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px]">ทดสอบพิมพ์</span>
        </button>

        <button
          onClick={() => setCurrentMode('browse')}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
            currentMode === 'browse' ? 'text-zinc-950 font-bold' : 'text-zinc-600'
          }`}
        >
          <Search className="w-5 h-5" />
          <span className="text-[10px]">คลังตัวบท</span>
        </button>
      </nav>

      {/* Modals */}
      <CardEditorModal
        isOpen={isAddOpen}
        onClose={() => {
          setIsAddOpen(false);
          setEditingCard(null);
        }}
        onSaveCard={handleSaveCard}
        editingCard={editingCard}
      />

      <CardDetailModal
        card={viewingCard}
        isOpen={!!viewingCard}
        onClose={() => setViewingCard(null)}
        onEdit={c => {
          setEditingCard(c);
          setIsAddOpen(true);
        }}
        onDelete={handleDeleteCard}
        onToggleStar={handleToggleStar}
      />

      <StatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        cards={cards}
        stats={stats}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
        cards={cards}
        onImportCards={handleImportCards}
        onResetToDefault={handleResetToDefault}
        onClearAllCards={handleClearAllCards}
      />
    </div>
  );
}

export default App;
