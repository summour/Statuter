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
  titleStructure?: string;  // ลักษณะ (เช่น "ลักษณะ ๑ บทบัญญัติที่ใช้แก่ความผิดทั่วไป")
  chapter?: string;         // หมวด (เช่น "หมวด ๔ ความรับผิดในทางอาญา")
  part?: string;            // ส่วน (เช่น "ส่วนที่ ๑ ...")
  
  sectionNumber: string;    // เลขมาตรา (เช่น "มาตรา ๕๙" หรือ "มาตรา 59")
  sectionRawNum: number;    // 59
  title?: string;           // ชื่อเรื่อง / หัวข้อมาตรา
  
  fullText: string;         // ตัวบทกฎหมายฉบับเต็ม
  paragraphs?: LawParagraph[]; // วรรค / อนุ แยกแสดงเพื่อความชัดเจน
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
