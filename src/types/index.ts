export type LawCodeCategory = 
  | 'criminal'      // ประมวลกฎหมายอาญา
  | 'civil'         // ประมวลกฎหมายแพ่งและพาณิชย์
  | 'crim_proc'     // ประมวลกฎหมายวิธีพิจารณาความอาญา
  | 'civ_proc'      // ประมวลกฎหมายวิธีพิจารณาความแพ่ง
  | 'constitution'  // รัฐธรรมนูญแห่งราชอาณาจักรไทย
  | 'custom';       // หมวดกฎหมายที่ผู้ใช้เพิ่มเอง

export type CardGrade = 'again' | 'hard' | 'good' | 'easy';

export type CardStatus = 'new' | 'learning' | 'review' | 'mastered';

export interface SRSState {
  interval: number;       // in days (0 = today)
  repetition: number;     // consecutive successful reviews
  easeFactor: number;     // default 2.50
  dueDate: string;        // YYYY-MM-DD
  lastReviewed: string | null;
  status: CardStatus;
  lapses: number;         // number of times failed (again)
  totalReviews: number;
}

export interface LawElement {
  number: number;
  label: string;          // e.g. "1. ผู้ใด"
  explanation?: string;   // e.g. "บุคคลธรรมดา"
}

export interface LawCard {
  id: string;
  codeCategory: LawCodeCategory;
  codeName: string;       // e.g. "ประมวลกฎหมายอาญา"
  codeShortName: string;  // e.g. "ป.อ."
  sectionNumber: string;  // e.g. "มาตรา 59"
  sectionRawNum: number;  // for sorting
  title: string;          // e.g. "หลักความรับผิดในทางอาญา (เจตนา-ประมาท)"
  fullText: string;       // Full law verbatim text
  simplifiedSummary: string; // สรุปหลักการจำ
  elements: string[];     // แยกองค์ประกอบความผิด/นิติกรรม
  clozeKeywords: string[];// คำสำคัญสำหรับ Cloze deletion
  exceptions: string[];   // ข้อยกเว้น หรือ วรรคพิเศษ
  keyRulings?: string[];  // ข้อสังเกต / ฎีกาสำคัญ
  mnemonic?: string;      // เทคนิคการจำ / คำย่อ
  tags: string[];         // e.g. ["#เนติบัณฑิต", "#อาญาภาค1"]
  isStarred: boolean;
  srs: SRSState;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  id: LawCodeCategory | 'all';
  name: string;
  shortName: string;
  description: string;
  icon?: string;
  iconName?: string;
  colorTheme?: string;
  totalCards: number;
  newCards: number;
  dueCards: number;
  learningCards: number;
  masteredCards: number;
}

export type StudyMode = 
  | 'flashcard'    // Anki Flip & Grade
  | 'cloze'        // เติมคำในช่องว่าง (Cloze Deletion)
  | 'elements'     // แยกองค์ประกอบตัวบท
  | 'recite_test'  // พิมพ์ทดสอบตัวบทเต็ม
  | 'browse';      // ค้นหาและอ่านตัวบททั้งหมด

export interface ReviewLog {
  id: string;
  cardId: string;
  sectionNumber: string;
  codeCategory: LawCodeCategory | 'all';
  grade: CardGrade;
  timestamp: string;
  studyMode: StudyMode;
}

export interface UserStats {
  dailyStreak: number;
  lastStudyDate: string | null;
  totalReviewsToday: number;
  dailyGoal: number;
  totalCardsLearned?: number;
  reviewLogs: ReviewLog[];
}

export interface AppSettings {
  autoSpeakOnFlip: boolean;
  speechRate: number;      // 0.8 to 1.2
  vibrateOnTap: boolean;
  theme: 'white' | 'dark'; // B&W theme
  dailyReviewGoal: number;
  shuffleCards: boolean;
}
