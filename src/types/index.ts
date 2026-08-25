export interface LawParagraph {
  label: string; // e.g. "วรรคหนึ่ง", "วรรคสอง", "(๑)", "(๒)"
  text: string;
}

export interface LawCard {
  id: string;
  deckId: string;
  deckName: string;
  deckShortName: string;
  
  // โครงสร้างระบบกฎหมาย (Legal Structure Hierarchy)
  book?: string;            // บรรพ หรือ ภาค (เช่น "บรรพ ๑ หลักทั่วไป" หรือ "ภาค ๑ บทบัญญัติทั่วไป")
  titleStructure?: string;  // ลักษณะ (เช่น "ลักษณะ ๑ บทเบ็ดเสร็จทั่วไป")
  chapter?: string;         // หมวด (เช่น "หมวด ๑ บุคคลธรรมดา")
  part?: string;            // ส่วน (เช่น "ส่วนที่ ๑ สภาพบุคคล")
  
  sectionNumber: string;    // เลขมาตรา (เช่น "มาตรา ๑" หรือ "มาตรา 193/1")
  sectionRawNum: number;    // 1 หรือ 193.1
  title?: string;           // ชื่อเรื่อง / หัวข้อมาตรา
  
  fullText: string;         // ตัวบทกฎหมายฉบับเต็ม (ตรงตามต้นฉบับ 100%)
  paragraphs?: LawParagraph[]; // วรรค / อนุ แยกแสดงเพื่อความชัดเจน
  
  isVerified?: boolean;     // ผ่านการตรวจสอบความถูกต้องแล้ว
  notes?: string;           // บันทึกเพิ่มเติม หรือเชิงอรรถ
  createdAt?: number;
}

export interface LawDeck {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: 'code' | 'proc' | 'constitution' | 'act' | 'custom';
  categoryLabel: string;
  iconName: string;
}

export type ParsedSectionStatus = 'valid' | 'uncertain' | 'duplicate' | 'error';

export interface ParsedLawSection {
  tempId: string;
  sectionNumber: string;
  sectionRawNum: number;
  book?: string;
  titleStructure?: string;
  chapter?: string;
  part?: string;
  title?: string;
  fullText: string;
  paragraphs: LawParagraph[];
  status: ParsedSectionStatus;
  uncertaintyReason?: string;
  errorDetail?: string;
  originalLineNumber: number;
  isResolved?: boolean;
  isDuplicate?: boolean;
  duplicateWithExisting?: boolean;
  duplicateCardId?: string;
  isInsertedSection?: boolean; // เช่น มาตรา ๑๙๓/๑, ๑๐๙๖ ทวิ
  isRepealed?: boolean;        // เช่น (ยกเลิก), [ยกเลิกโดย...]
  isPrimarySection?: boolean;   // มาตราลำดับหลัก 1 - 1755
}

export interface ImportAuditReport {
  totalCount: number;
  validCount: number;
  uncertainCount: number;
  duplicateCount: number;
  errorCount: number;
  primaryCount: number;       // เช่น 1,755 มาตราหลัก
  insertedCount: number;      // เช่น 94 มาตราแทรก (/ หรือ ทวิ/ตรี...)
  repealedCount: number;      // จำนวนมาตราที่ถูกยกเลิกแล้ว
  lawNameDetected: string;
  bookBreakdown: { name: string; count: number }[];
  sections: ParsedLawSection[];
  uncertainSections: ParsedLawSection[];
  duplicateSections: ParsedLawSection[];
  errorSections: ParsedLawSection[];
  rawTextLength: number;
  parsedAt: string;
}
