import { LawCard } from '../types';

export const INITIAL_LAW_CARDS: LawCard[] = [];

export const LAW_CATEGORIES_INFO: Record<string, { name: string; shortName: string; description: string; icon: string }> = {
  all: {
    name: 'ทุกหมวดกฎหมาย',
    shortName: 'รวมทุกหมวด',
    description: 'ทบทวนตัวบทกฎหมายทุกฉบับที่ถึงกำหนดทบทวนในวันนี้',
    icon: 'Layers',
  },
  criminal: {
    name: 'ประมวลกฎหมายอาญา',
    shortName: 'ป.อ.',
    description: 'หลักความรับผิดทางอาญา เจตนา ประมาท ความผิดต่อชีวิต ทรัพย์ ร่างกาย',
    icon: 'ShieldAlert',
  },
  civil: {
    name: 'ประมวลกฎหมายแพ่งและพาณิชย์',
    shortName: 'ป.พ.พ.',
    description: 'นิติกรรม สัญญา ละเมิด ทรัพย์สิน หนี้ ครอบครัว มรดก',
    icon: 'Scale',
  },
  crim_proc: {
    name: 'ประมวลกฎหมายวิธีพิจารณาความอาญา',
    shortName: 'ป.วิ.อ.',
    description: 'ผู้เสียหาย อำนาจฟ้อง การสอบสวน ไต่สวนมูลฟ้อง และคำพิพากษา',
    icon: 'Gavel',
  },
  civ_proc: {
    name: 'ประมวลกฎหมายวิธีพิจารณาความแพ่ง',
    shortName: 'ป.วิ.พ.',
    description: 'สิทธิเสนอคดี คำฟ้อง ฟ้องซ้ำ ดำเนินกระบวนพิจารณาซ้ำ การอุทธรณ์ฎีกา',
    icon: 'FileText',
  },
  constitution: {
    name: 'รัฐธรรมนูญแห่งราชอาณาจักรไทย',
    shortName: 'รธน.',
    description: 'สิทธิเสรีภาพ อำนาจอธิปไตย องค์กรตามรัฐธรรมนูญ และศาลรัฐธรรมนูญ',
    icon: 'Landmark',
  },
  custom: {
    name: 'ตัวบทที่ฉันบันทึกเอง',
    shortName: 'มาตราของฉัน',
    description: 'มาตราพิเศษ กฎหมายเฉพาะ หรือตัวบทที่คุณสร้างขึ้นเอง',
    icon: 'BookmarkCheck',
  }
};

export const DEFAULT_LAW_CARDS = INITIAL_LAW_CARDS;
