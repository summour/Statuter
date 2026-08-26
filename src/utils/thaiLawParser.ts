import { LawParagraph, ParsedLawSection, ImportAuditReport, LawCard, NumeralSystem } from '../types';

// Convert Thai numerals string to standard Arabic number string
export function thaiToArabicDigits(str: string): string {
  if (!str) return '';
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  let res = str;
  thaiDigits.forEach((digit, index) => {
    res = res.replaceAll(digit, index.toString());
  });
  return res;
}

// Convert Arabic digits to Thai digits
export function arabicToThaiDigits(str: string): string {
  if (!str) return '';
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  let res = str;
  for (let i = 0; i <= 9; i++) {
    res = res.replaceAll(i.toString(), thaiDigits[i]);
  }
  return res;
}

// Format any text according to selected NumeralSystem preference
export function formatNumeralText(text: string | undefined | null, system: NumeralSystem): string {
  if (!text) return '';
  if (system === 'arabic') {
    return thaiToArabicDigits(text);
  }
  if (system === 'thai') {
    return arabicToThaiDigits(text);
  }
  return text;
}

// Format structured paragraphs with selected NumeralSystem
export function formatParagraphs(paragraphs: LawParagraph[] | undefined, system: NumeralSystem): LawParagraph[] | undefined {
  if (!paragraphs) return undefined;
  if (system === 'original') return paragraphs;
  return paragraphs.map(p => ({
    label: formatNumeralText(p.label, system),
    text: formatNumeralText(p.text, system),
  }));
}

// Calculate sortable raw number from section string (e.g. "มาตรา ๑๙๓/๑" -> 193.001, "มาตรา ๒๕ ทวิ" -> 25.001)
export function parseRawSectionNumber(secStr: string): number {
  if (!secStr) return 0;
  const arabicStr = thaiToArabicDigits(secStr);
  const match = arabicStr.match(/(\d+)(?:\/(\d+))?/);
  if (!match) return 0;
  const main = parseInt(match[1], 10);
  let sub = match[2] ? parseInt(match[2], 10) / 1000 : 0;

  // Handle Thai statutory legal suffixes (ทวิ, ตรี, จัตวา, เบญจ, ฉ, สัตต, อัฏฐ/อัฐ, นว/นพ, ทศ)
  if (arabicStr.includes('ทวิ')) sub += 0.001;
  else if (arabicStr.includes('ตรี')) sub += 0.002;
  else if (arabicStr.includes('จัตวา')) sub += 0.003;
  else if (arabicStr.includes('เบญจ')) sub += 0.004;
  else if (arabicStr.includes('ฉศก') || (arabicStr.includes('ฉ') && !arabicStr.includes('เฉพาะ'))) sub += 0.005;
  else if (arabicStr.includes('สัตต')) sub += 0.006;
  else if (arabicStr.includes('อัฏฐ') || arabicStr.includes('อัฐ')) sub += 0.007;
  else if (arabicStr.includes('นว') || arabicStr.includes('นพ')) sub += 0.008;
  else if (arabicStr.includes('ทศ')) sub += 0.009;

  return main + sub;
}

// Check if a line is a legal hierarchy header (บรรพ, ภาค, ลักษณะ, หมวด, ส่วนที่, บทเฉพาะกาล)
interface HierarchyMatch {
  type: 'law_title' | 'book' | 'titleStructure' | 'chapter' | 'part';
  fullLabel: string;
}

// Regex to identify starting line of section: e.g. "มาตรา ๑", "มาตรา 193/1", "มาตรา ๑๐๙๖ ทวิ[53]"
const SECTION_START_REGEX = /^[\s\t]*(มาตรา\s*([0-9\u0E50-\u0E59]+(?:\/[0-9\u0E50-\u0E59]+)?(?:\s*(?:ทวิ|ตรี|จัตวา|เบญจ|ฉ|สัตต|อัฏฐ|นว|ทศ))?))(?:\s*\[[0-9\u0E50-\u0E59a-zA-Z\s]+\])?\s*([\s\S]*)$/u;

export function isSectionHeader(line: string): boolean {
  return SECTION_START_REGEX.test(line.trim());
}

// Regex for standalone structural divisions in Thai law (e.g. บททั่วไป, ข้อความเบื้องต้น, บทเบ็ดเสร็จทั่วไป, บทบัญญัติทั่วไป, บทนำ, บทนิยาม, คำปรารภ, บทเฉพาะกาล, บทกำหนดโทษ, บทส่งท้าย)
const STANDALONE_CHAPTER_REGEX = /^\(?\s*(บททั่วไป|ข้อความเบื้องต้น|บทเบ็ดเสร็จทั่วไป|บทบัญญัติทั่วไป|บทนำ|บทนิยาม|คำปรารภ|บทเฉพาะกาล|บทเฉพาะการ|บทกำหนดโทษ|บทส่งท้าย)\s*\)?(?:\s*[:：-])?(?:\s*\[[0-9\u0E50-\u0E59a-zA-Z\s]+\])?(?:\s*\(.*?\))?$/u;

export function isStandaloneChapterHeader(line: string): boolean {
  const trimmed = stripFootnotes(line.trim()).trim();
  if (!trimmed) return false;
  return STANDALONE_CHAPTER_REGEX.test(trimmed);
}

// Strict Regex for structural divisions in Thai law
const BOOK_PREFIX_REGEX = /^(?:บรรพ|ภาค)\s*([0-9\u0E50-\u0E59]+|[๑-๙IVXLCDMivxlcdm]+|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ)(?:\s|$|[:：\/-])/u;
const TITLE_PREFIX_REGEX = /^ลักษณะ\s*([0-9\u0E50-\u0E59]+|[๑-๙IVXLCDMivxlcdm]+|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ|พิเศษ)(?:\s|$|[:：\/-])/u;
const CHAPTER_PREFIX_REGEX = /^หมวด\s*(?:ที่\s*)?([0-9\u0E50-\u0E59]+(?:\/[0-9\u0E50-\u0E59]+)?|[๑-๙IVXLCDMivxlcdm]+|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ)(?:\s|$|[:：\/-])/u;
const PART_PREFIX_REGEX = /^ส่วน(?:ที่)?\s*([0-9\u0E50-\u0E59]+(?:\/[0-9\u0E50-\u0E59]+)?|[๑-๙IVXLCDMivxlcdm]+|หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า|สิบ)(?:\s|$|[:：\/-])/u;

// Helper to check if a line is a major hierarchy prefix that starts a new structure
function isMajorHierarchyPrefix(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.length > 80) return false;
  return (
    BOOK_PREFIX_REGEX.test(trimmed) ||
    TITLE_PREFIX_REGEX.test(trimmed) ||
    CHAPTER_PREFIX_REGEX.test(trimmed) ||
    PART_PREFIX_REGEX.test(trimmed) ||
    STANDALONE_CHAPTER_REGEX.test(trimmed) ||
    /^(?:ประมวลกฎหมาย|พระราชบัญญัติ|พระราชกำหนด|รัฐธรรมนูญแห่งราชอาณาจักรไทย)/u.test(trimmed)
  );
}

function findNextCandidateTitle(lines: string[], startIndex: number, maxLookahead = 4): { text: string; index: number } | null {
  for (let k = startIndex; k < lines.length && k < startIndex + maxLookahead; k++) {
    const t = lines[k].trim();
    if (t) {
      if (isMajorHierarchyPrefix(t) || isSectionHeader(t) || isSignOffOrEndMatterLine(t) || isFootnoteDefinitionLine(t)) {
        return null;
      }
      if (t.length > 90) return null;
      return { text: t, index: k };
    }
  }
  return null;
}

interface AdvancedHierarchyMatch {
  type: 'book' | 'titleStructure' | 'chapter' | 'part' | 'law_title';
  fullLabel: string;
  consumedIndex: number;
}

function matchHierarchyAdvanced(lines: string[], i: number): AdvancedHierarchyMatch | null {
  const line = lines[i];
  const trimmed = line.trim();
  if (!trimmed) return null;

  const cleanTrimmed = stripFootnotes(trimmed).trim();

  // 1. บรรพ / ภาค
  if (BOOK_PREFIX_REGEX.test(cleanTrimmed) && cleanTrimmed.length <= 80) {
    let full = cleanTrimmed;
    let consumed = i + 1;
    // If it only has the number or is very short, look ahead for title name (e.g. หลักทั่วไป)
    const nextCandidate = findNextCandidateTitle(lines, i + 1);
    if (nextCandidate) {
      full = `${cleanTrimmed} ${stripFootnotes(nextCandidate.text).trim()}`;
      consumed = nextCandidate.index + 1;
    }
    return { type: 'book', fullLabel: full, consumedIndex: consumed };
  }

  // 2. ลักษณะ
  if (TITLE_PREFIX_REGEX.test(cleanTrimmed) && cleanTrimmed.length <= 80) {
    let full = cleanTrimmed;
    let consumed = i + 1;
    const nextCandidate = findNextCandidateTitle(lines, i + 1);
    if (nextCandidate) {
      full = `${cleanTrimmed} ${stripFootnotes(nextCandidate.text).trim()}`;
      consumed = nextCandidate.index + 1;
    }
    return { type: 'titleStructure', fullLabel: full, consumedIndex: consumed };
  }

  // 3. หมวด (รวมถึง หมวด ... บทเฉพาะกาล)
  if (CHAPTER_PREFIX_REGEX.test(cleanTrimmed) && cleanTrimmed.length <= 80) {
    let full = cleanTrimmed;
    let consumed = i + 1;
    const nextCandidate = findNextCandidateTitle(lines, i + 1);
    if (nextCandidate) {
      full = `${cleanTrimmed} ${stripFootnotes(nextCandidate.text).trim()}`;
      consumed = nextCandidate.index + 1;
    }
    return { type: 'chapter', fullLabel: full, consumedIndex: consumed };
  }

  // 4. ส่วนที่ / ส่วน
  if (PART_PREFIX_REGEX.test(cleanTrimmed) && cleanTrimmed.length <= 80) {
    let full = cleanTrimmed;
    let consumed = i + 1;
    const nextCandidate = findNextCandidateTitle(lines, i + 1);
    if (nextCandidate) {
      full = `${cleanTrimmed} ${stripFootnotes(nextCandidate.text).trim()}`;
      consumed = nextCandidate.index + 1;
    }
    return { type: 'part', fullLabel: full, consumedIndex: consumed };
  }

  // 5. บทเฉพาะกาล (Transitory Provisions) และบทพิเศษที่อยู่แยกเดี่ยว (Standalone Chapter)
  if (STANDALONE_CHAPTER_REGEX.test(cleanTrimmed)) {
    let full = cleanTrimmed;
    let consumed = i + 1;
    const nextCandidate = findNextCandidateTitle(lines, i + 1);
    if (nextCandidate) {
      full = `${cleanTrimmed} ${stripFootnotes(nextCandidate.text).trim()}`;
      consumed = nextCandidate.index + 1;
    }
    // Normalize typo "บทเฉพาะการ" -> "บทเฉพาะกาล"
    if (full.startsWith('บทเฉพาะการ')) {
      full = full.replace('บทเฉพาะการ', 'บทเฉพาะกาล');
    }
    return { type: 'chapter', fullLabel: full, consumedIndex: consumed };
  }

  // 6. Law Title in first few lines
  if (/^(?:ประมวลกฎหมาย|พระราชบัญญัติ|พระราชกำหนด|รัฐธรรมนูญแห่งราชอาณาจักรไทย)/u.test(trimmed)) {
    return { type: 'law_title', fullLabel: cleanTrimmed, consumedIndex: i + 1 };
  }

  return null;
}

// Strip footnote reference markers like [1], [2], [๑], [๒], [53], [เชิงอรรถ 1]
export function stripFootnotes(text: string): string {
  if (!text) return '';
  return text
    // Remove bracketed footnote numbers like [1], [2], [10], [๑], [๒], [๑๐], [เชิงอรรถ: 1]
    .replace(/\[\s*(?:เชิงอรรถ\s*[:：]?\s*)?[0-9\u0E50-\u0E59a-zA-Z]+(?:\/[0-9\u0E50-\u0E59a-zA-Z]+)?\s*\]/gu, '')
    // Clean up excessive horizontal whitespace left after footnote removal
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

// Check if a line is a footnote definition line (e.g. "[1] ราชกิจจานุเบกษา...", "[2] แก้ไขเพิ่มเติมโดย...")
export function isFootnoteDefinitionLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return (
    /^\s*\[\s*[0-9\u0E50-\u0E59]+(?:\/[0-9\u0E50-\u0E59]+)?\s*\]\s*(?:ราชกิจจานุเบกษา|แก้ไขเพิ่มเติม|ยกเลิก|ความเดิม|ความใน|เพิ่มเติม|พระราชบัญญัติ|พ\.ร\.บ\.|ประกาศ|ดู|หมายเหตุ|เหตุผล)/u.test(trimmed) ||
    /^\s*\[\s*[0-9\u0E50-\u0E59]+\s*\]\s*[\s\S]*$/u.test(trimmed) ||
    /^\s*(?:เชิงอรรถ|หมายเหตุ\s*:-?)\s*[\s\S]*$/u.test(trimmed)
  );
}

// Identify end-matter headers: Footnotes, Amending Acts (พ.ร.บ. แก้ไขเพิ่มเติม), Sign-offs (ผู้รับสนองพระราชโองการ), etc.
export function isEndMatterHeader(line: string): boolean {
  const trimmed = line.trim();
  return (
    /^(?:พระราชบัญญัติแก้ไขเพิ่มเติม|พระราชบัญญัติให้ใช้|พระราชกำหนด|ประกาศคณะปฏิวัติ|เชิงอรรถ|หมายเหตุ\s*[:：-]|เหตุผลในการประกาศใช้|หมายเหตุท้าย|ผู้รับสนองพระราชโองการ|ผู้รับสนองพระบรมราชโองการ|ผู้สนองพระบรมราชโองการ|พระราชทานไว้\s*ณ|ประกาศ\s*ณ\s*วันที่|ให้ไว้\s*ณ\s*วันที่|\(พระปรมาภิไธย\)|\[[0-9\u0E50-\u0E59]+\]\s*(?:ราชกิจจานุเบกษา|แก้ไข|ยกเลิก|ความเดิม|พระราช|พ\.ร\.บ\.))/u.test(trimmed) ||
    /^(?:นายกรัฐมนตรี|ประธานสภานิติบัญญัติแห่งชาติ|ประธานคณะรักษาความสงบแห่งชาติ|ประธานรัฐสภา)$/u.test(trimmed)
  );
}

// Check if a line is a legislative sign-off / countersignature / name / position line
export function isSignOffOrEndMatterLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  return (
    isEndMatterHeader(trimmed) ||
    /^(?:ผู้รับสนองพระราชโองการ|ผู้รับสนองพระบรมราชโองการ|ผู้สนองพระบรมราชโองการ)/u.test(trimmed) ||
    /^(?:พระราชทานไว้\s*ณ|ประกาศ\s*ณ\s*วันที่|ให้ไว้\s*ณ\s*วันที่|\(พระปรมาภิไธย\))/u.test(trimmed) ||
    /^(?:หมายเหตุ\s*[:：-]|เหตุผลในการประกาศใช้|หมายเหตุท้าย)/u.test(trimmed) ||
    /^(?:นายกรัฐมนตรี|ประธานสภานิติบัญญัติแห่งชาติ|ประธานคณะรักษาความสงบแห่งชาติ|ประธานรัฐสภา|รัฐมนตรีว่าการ)$/u.test(trimmed) ||
    /^(?:พลเอก|พลโท|พลตรี|พันเอก|พันโท|พันตรี|ร้อยเอก|นาย|นาง|นางสาว|พลตำรวจเอก|หม่อมราชวงศ์|ม\.ร\.ว\.)\s+[^\n]+/u.test(trimmed) && trimmed.length < 50
  );
}

// Strip sign-off, royal approval, and end-matter blocks from statute text
export function stripSignOffAndEndMatter(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const cleanLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // If we hit any sign-off or end-matter header, stop taking any subsequent lines
    if (
      isEndMatterHeader(trimmed) ||
      /^(?:ผู้รับสนองพระราชโองการ|ผู้รับสนองพระบรมราชโองการ|ผู้สนองพระบรมราชโองการ)/u.test(trimmed) ||
      /^(?:พระราชทานไว้\s*ณ|ประกาศ\s*ณ\s*วันที่|ให้ไว้\s*ณ\s*วันที่|\(พระปรมาภิไธย\))/u.test(trimmed) ||
      /^(?:หมายเหตุ\s*[:：-]|เหตุผลในการประกาศใช้)/u.test(trimmed)
    ) {
      break;
    }

    cleanLines.push(rawLine);
  }

  return cleanLines.join('\n').trim();
}

// Extract paragraphs (วรรค / อนุมาตรา) accurately from verbatim section text
export function extractParagraphs(fullText: string, shouldFilterFootnotes = true): LawParagraph[] {
  if (!fullText || !fullText.trim()) return [];

  // Strip sign-off, countersignatures, and end-matter first
  const signOffStripped = stripSignOffAndEndMatter(fullText);
  const cleanedText = shouldFilterFootnotes ? stripFootnotes(signOffStripped) : signOffStripped;
  const rawLines = cleanedText.split('\n');
  const paragraphs: LawParagraph[] = [];
  const thaiOrdinalWords = [
    'วรรคหนึ่ง', 'วรรคสอง', 'วรรคสาม', 'วรรคสี่', 'วรรคห้า',
    'วรรคหก', 'วรรคเจ็ด', 'วรรคแปด', 'วรรคเก้า', 'วรรคสิบ',
    'วรรคสิบเอ็ด', 'วรรคสิบสอง', 'วรรคสิบสาม', 'วรรคสิบสี่'
  ];

  // Regex for sub-items: e.g. "(๑)", "(๒)", "(1)", "(2)", "(ก)", "(ข)", "(ค)"
  const subItemRegex = /^(\([0-9\u0E50-\u0E59a-zA-Z\u0E01-\u0E2E]+\))\s*([\s\S]*)$/u;

  let currentLabel = '';
  let currentTextLines: string[] = [];
  let paragraphCounter = 0;

  const flush = () => {
    if (currentLabel && currentTextLines.length > 0) {
      const combinedText = currentTextLines.join(' ').replace(/\s+/g, ' ').trim();
      const finalText = shouldFilterFootnotes ? stripFootnotes(combinedText) : combinedText;
      // Ensure the paragraph text itself isn't a sign-off line
      if (finalText && !isSignOffOrEndMatterLine(finalText)) {
        paragraphs.push({
          label: currentLabel,
          text: finalText,
        });
      }
      currentLabel = '';
      currentTextLines = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = shouldFilterFootnotes ? stripFootnotes(raw).trim() : raw.trim();

    if (!trimmed || (shouldFilterFootnotes && isFootnoteDefinitionLine(trimmed))) {
      // Empty line signals explicit separation or skipped footnote line
      flush();
      continue;
    }

    // If this line is a sign-off or end-matter line, stop extracting further paragraphs
    if (isSignOffOrEndMatterLine(trimmed)) {
      flush();
      break;
    }

    // Check if line starts with sub-item like (๑), (๒), (ก)...
    const subMatch = trimmed.match(subItemRegex);
    if (subMatch) {
      flush();
      currentLabel = subMatch[1];
      if (subMatch[2] && subMatch[2].trim()) {
        currentTextLines.push(subMatch[2].trim());
      }
      continue;
    }

    // Check if this line is an indented line (indicating a new paragraph in Thai legal typesetting)
    const hasLeadingIndent = /^[\s\t]{2,}/.test(raw);

    if (hasLeadingIndent || !currentLabel) {
      flush();
      currentLabel = thaiOrdinalWords[paragraphCounter] || `วรรคที่ ${paragraphCounter + 1}`;
      paragraphCounter++;
      currentTextLines.push(trimmed);
    } else {
      // Continuous wrapped line belonging to current paragraph or sub-item
      currentTextLines.push(trimmed);
    }
  }

  flush();
  return paragraphs;
}

export interface ParseOptions {
  existingCards?: LawCard[];
  targetDeckId?: string;
  filterAmendingActs?: boolean; // Default true: filters out amending acts & footnotes from main law stream
  filterFootnotes?: boolean;   // Default true: filters out [1], [2], [53] footnote tags and annotations
}

/**
 * 100% Deterministic Rule-Based Legal Document Parser
 * Parses legal text line-by-line, tracks hierarchical levels, extracts verbatim sections,
 * identifies uncertainty reasons, and computes full pre-import validation statistics.
 */
export function parseThaiLawText(rawText: string, options: ParseOptions = {}): ImportAuditReport {
  const lines = rawText.split('\n');
  const sections: ParsedLawSection[] = [];
  const existingCards = options.existingCards || [];
  const shouldFilterAmendingActs = options.filterAmendingActs !== false;
  const shouldFilterFootnotes = options.filterFootnotes !== false;

  let footnotesRemovedCount = 0;

  // Pre-calculate footnote count in original text if filtering
  if (shouldFilterFootnotes) {
    const footnoteMatches = rawText.match(/\[\s*(?:เชิงอรรถ\s*[:：]?\s*)?[0-9\u0E50-\u0E59a-zA-Z]+(?:\/[0-9\u0E50-\u0E59a-zA-Z]+)?\s*\]/gu);
    footnotesRemovedCount = footnoteMatches ? footnoteMatches.length : 0;
  }

  let currentLawName = 'ประมวลกฎหมาย';
  let currentBook = '';
  let currentTitleStructure = '';
  let currentChapter = '';
  let currentPart = '';

  let currentSectionNumber = '';
  let currentSectionRawNum = 0;
  let currentSectionLines: string[] = [];
  let currentStartLine = 1;
  let insideEndMatter = false;

  const seenSectionNumbers = new Set<string>();
  const duplicateSectionNumbers = new Set<string>();

  // Helper to commit current accumulated section
  const commitSection = () => {
    if (!currentSectionNumber) return;

    // Filter footnote definition lines if enabled
    let sectionLinesToProcess = currentSectionLines;
    if (shouldFilterFootnotes) {
      sectionLinesToProcess = sectionLinesToProcess.filter(l => !isFootnoteDefinitionLine(l));
    }

    // Join verbatim text preserving original structure
    let processedFullText = sectionLinesToProcess.join('\n').trim();
    processedFullText = stripSignOffAndEndMatter(processedFullText);
    if (shouldFilterFootnotes) {
      processedFullText = stripFootnotes(processedFullText);
    }

    const cleanSecNum = shouldFilterFootnotes 
      ? stripFootnotes(currentSectionNumber).trim() 
      : currentSectionNumber.trim();

    // Check uncertainty & errors
    let status: ParsedLawSection['status'] = 'valid';
    let uncertaintyReason: string | undefined;
    let errorDetail: string | undefined;

    const isInserted = /[\/]|ทวิ|ตรี|จัตวา|เบญจ|ฉ|สัตต|อัฏฐ|นว|ทศ/u.test(cleanSecNum);
    const isRepealed = processedFullText.includes('(ยกเลิก)') || processedFullText.includes('ยกเลิกโดย') || processedFullText.includes('[ยกเลิก]') || processedFullText.trim() === '(ยกเลิก)' || processedFullText.trim() === 'ยกเลิก';
    const isPrimarySection = !isInserted;

    const isEmpty = processedFullText.length === 0;
    const isVeryShort = processedFullText.length < 5 && !isRepealed;
    const hasUnclosedBracket = (processedFullText.match(/\[/g) || []).length !== (processedFullText.match(/\]/g) || []).length;
    
    // Check duplication with file itself
    const normalizedSecNum = thaiToArabicDigits(cleanSecNum).replace(/\s+/g, '');
    const isDuplicateInFile = duplicateSectionNumbers.has(normalizedSecNum);

    // Check duplicate with existing database
    const existingMatch = existingCards.find(c => {
      if (options.targetDeckId && c.deckId !== options.targetDeckId) return false;
      const cNorm = thaiToArabicDigits(c.sectionNumber).replace(/\s+/g, '');
      return cNorm === normalizedSecNum;
    });

    if (isEmpty) {
      status = 'error';
      errorDetail = 'ไม่พบเนื้อหาตัวบทของมาตรานี้ (ข้อความว่างเปล่า)';
    } else if (isRepealed) {
      status = 'uncertain';
      uncertaintyReason = 'มาตรานี้มีสถานะถูกยกเลิก (ยกเลิก) — ควรตรวจสอบประวัติการแก้ไข';
    } else if (isVeryShort) {
      status = 'uncertain';
      uncertaintyReason = 'เนื้อหาตัวบทสั้นผิดปกติ อาจเกิดจากการตัดคำหรือไฟล์ไม่สมบูรณ์';
    } else if (hasUnclosedBracket) {
      status = 'uncertain';
      uncertaintyReason = 'พบเครื่องหมายวงเล็บเหลี่ยม [...] ไม่สมบูรณ์ (อาจมีเชิงอรรถค้าง)';
    } else if (isDuplicateInFile) {
      status = 'duplicate';
      uncertaintyReason = 'พบเลขมาตรานี้ซ้ำกันหลายครั้งในไฟล์นำเข้าเดียวกัน';
    } else if (existingMatch) {
      status = 'duplicate';
      uncertaintyReason = `พบมาตรานี้มีอยู่แล้วในฐานข้อมูล (${existingMatch.deckShortName || existingMatch.deckName})`;
    }

    const paragraphs = extractParagraphs(processedFullText, shouldFilterFootnotes);

    // Auto-detect short title if first line is in quotes or has pattern
    let extractedTitle: string | undefined;
    const firstLine = sectionLinesToProcess[0] || '';
    const quoteMatch = firstLine.match(/คำว่า\s*[“"']([^”"']+)["'”]/);
    if (quoteMatch) {
      extractedTitle = quoteMatch[1];
    } else if (processedFullText.includes('หมายความว่า')) {
      const defMatch = processedFullText.match(/^([^\s]+)\s+หมายความว่า/);
      if (defMatch) extractedTitle = defMatch[1];
    }

    // Fallback: If section appears before any hierarchy is declared, assign to 'บททั่วไป'
    const assignedBook = currentBook || undefined;
    const assignedTitleStructure = currentTitleStructure || undefined;
    const assignedChapter = currentChapter || (!assignedBook && !assignedTitleStructure ? 'บททั่วไป' : undefined);

    const parsedSec: ParsedLawSection = {
      tempId: `sec_${Date.now()}_${sections.length + 1}_${Math.random().toString(36).substring(2, 7)}`,
      sectionNumber: cleanSecNum,
      sectionRawNum: currentSectionRawNum,
      book: assignedBook,
      titleStructure: assignedTitleStructure,
      chapter: assignedChapter,
      part: currentPart || undefined,
      title: extractedTitle,
      fullText: processedFullText,
      paragraphs,
      status,
      uncertaintyReason,
      errorDetail,
      originalLineNumber: currentStartLine,
      isDuplicate: isDuplicateInFile || !!existingMatch,
      duplicateWithExisting: !!existingMatch,
      duplicateCardId: existingMatch?.id,
      isInsertedSection: isInserted,
      isRepealed,
      isPrimarySection,
    };

    sections.push(parsedSec);

    // Reset section accumulator
    currentSectionNumber = '';
    currentSectionRawNum = 0;
    currentSectionLines = [];
  };

  // Pre-scan to identify duplicate section numbers in file (ignoring end-matter if filtered)
  let preScanEndMatter = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (isEndMatterHeader(trimmed) && seenSectionNumbers.size > 0) {
      preScanEndMatter = true;
      if (shouldFilterAmendingActs) break;
    }
    if (SECTION_START_REGEX.test(trimmed)) {
      const match = trimmed.match(SECTION_START_REGEX);
      if (match) {
        const rawSec = match[1].trim();
        const secNum = shouldFilterFootnotes ? stripFootnotes(rawSec).trim() : rawSec;
        const norm = thaiToArabicDigits(secNum).replace(/\s+/g, '');
        if (seenSectionNumbers.has(norm)) {
          duplicateSectionNumbers.add(norm);
        } else {
          seenSectionNumbers.add(norm);
        }
      }
    }
  }

  // Scan line by line
  let i = 0;
  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmedLine = rawLine.trim();

    // Check for End-Matter / Amending Acts at the bottom of the law text
    if (isEndMatterHeader(trimmedLine) && sections.length > 0) {
      if (shouldFilterAmendingActs) {
        // Commit current section and stop parsing end-matter amending acts into main code
        commitSection();
        break;
      } else {
        insideEndMatter = true;
        currentLawName = trimmedLine;
        currentBook = trimmedLine;
      }
    }

    // Check if line is empty
    if (!trimmedLine) {
      if (currentSectionNumber) {
        // Keep blank line if inside a section for paragraph preserving
        currentSectionLines.push('');
      }
      i++;
      continue;
    }

    // Skip footnote definition lines if enabled
    if (shouldFilterFootnotes && isFootnoteDefinitionLine(trimmedLine)) {
      i++;
      continue;
    }

    // Check for Section Header: "มาตรา ๑..."
    const secMatch = trimmedLine.match(SECTION_START_REGEX);
    if (secMatch) {
      // Commit previous section first
      commitSection();

      currentStartLine = i + 1;
      const capturedSec = secMatch[1].trim();
      currentSectionNumber = shouldFilterFootnotes ? stripFootnotes(capturedSec).trim() : capturedSec;
      currentSectionRawNum = parseRawSectionNumber(secMatch[2].trim());

      const inlineText = (secMatch[3] || '').trim();
      if (inlineText) {
        const cleanedInline = shouldFilterFootnotes ? stripFootnotes(inlineText).trim() : inlineText;
        if (cleanedInline) {
          currentSectionLines.push(cleanedInline);
        }
      }
      i++;
      continue;
    }

    // Check for Hierarchy (บรรพ, ลักษณะ, หมวด, ส่วนที่, พระราชบัญญัติ)
    const hier = matchHierarchyAdvanced(lines, i);
    if (hier) {
      // If we are currently collecting section text and hit hierarchy, commit section
      commitSection();

      switch (hier.type) {
        case 'law_title':
          currentLawName = hier.fullLabel;
          break;
        case 'book':
          currentBook = hier.fullLabel;
          currentTitleStructure = '';
          currentChapter = '';
          currentPart = '';
          break;
        case 'titleStructure':
          currentTitleStructure = hier.fullLabel;
          currentChapter = '';
          currentPart = '';
          break;
        case 'chapter':
          currentChapter = hier.fullLabel;
          currentPart = '';
          break;
        case 'part':
          currentPart = hier.fullLabel;
          break;
      }

      i = hier.consumedIndex;
      continue;
    }

    // Otherwise, this line is part of the current active section body
    if (currentSectionNumber) {
      const lineToAdd = shouldFilterFootnotes ? stripFootnotes(trimmedLine) : trimmedLine;
      if (lineToAdd) {
        currentSectionLines.push(lineToAdd);
      }
    } else {
      // Stray line before any section (e.g. intro or royal decrees notice)
      if (trimmedLine.startsWith('กฎหมายนี้ให้เรียกว่า') || trimmedLine.includes('ประมวลกฎหมาย')) {
        currentLawName = trimmedLine;
      }
    }

    i++;
  }

  // Commit last section
  commitSection();

  // Calculate Breakdown by Book / Chapter Hierarchy Group
  const bookCountMap = new Map<string, number>();
  for (const sec of sections) {
    const groupName = sec.book || sec.titleStructure || sec.chapter || 'บททั่วไป / ไม่ระบุหมวด';
    bookCountMap.set(groupName, (bookCountMap.get(groupName) || 0) + 1);
  }

  const bookBreakdown = Array.from(bookCountMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  const validSections = sections.filter(s => s.status === 'valid');
  const uncertainSections = sections.filter(s => s.status === 'uncertain');
  const duplicateSections = sections.filter(s => s.status === 'duplicate');
  const errorSections = sections.filter(s => s.status === 'error');

  const primaryCount = sections.filter(s => s.isPrimarySection).length;
  const insertedCount = sections.filter(s => s.isInsertedSection).length;
  const repealedCount = sections.filter(s => s.isRepealed).length;

  return {
    totalCount: sections.length,
    validCount: validSections.length,
    uncertainCount: uncertainSections.length,
    duplicateCount: duplicateSections.length,
    errorCount: errorSections.length,
    primaryCount,
    insertedCount,
    repealedCount,
    footnotesCleanedCount: footnotesRemovedCount,
    lawNameDetected: currentLawName,
    bookBreakdown,
    sections,
    uncertainSections,
    duplicateSections,
    errorSections,
    rawTextLength: rawText.length,
    parsedAt: new Date().toISOString(),
  };
}

/**
 * Sanitize an existing card by stripping any trailing legislative sign-offs,
 * countersignatures (เช่น ผู้รับสนองพระราชโองการ, นายกรัฐมนตรี), and cleaning its paragraphs.
 */
export function sanitizeCardTextAndParagraphs(card: LawCard): LawCard {
  const cleanFullText = stripSignOffAndEndMatter(card.fullText || '');
  let cleanParagraphs = card.paragraphs;

  if (cleanParagraphs && cleanParagraphs.length > 0) {
    cleanParagraphs = cleanParagraphs.filter(p => {
      const labelTrimmed = (p.label || '').trim();
      const textTrimmed = (p.text || '').trim();
      if (isSignOffOrEndMatterLine(textTrimmed) || isSignOffOrEndMatterLine(labelTrimmed)) {
        return false;
      }
      return true;
    });

    // Re-index standard ordinal labels if they were sequentially numbered
    const thaiOrdinalWords = [
      'วรรคหนึ่ง', 'วรรคสอง', 'วรรคสาม', 'วรรคสี่', 'วรรคห้า',
      'วรรคหก', 'วรรคเจ็ด', 'วรรคแปด', 'วรรคเก้า', 'วรรคสิบ',
      'วรรคสิบเอ็ด', 'วรรคสิบสอง', 'วรรคสิบสาม', 'วรรคสิบสี่'
    ];

    let vakCount = 0;
    cleanParagraphs = cleanParagraphs.map(p => {
      if (p.label.startsWith('วรรค')) {
        const newLabel = thaiOrdinalWords[vakCount] || `วรรค${vakCount + 1}`;
        vakCount++;
        return { ...p, label: newLabel };
      }
      return p;
    });
  }

  return {
    ...card,
    fullText: cleanFullText,
    paragraphs: cleanParagraphs && cleanParagraphs.length > 0 ? cleanParagraphs : undefined,
  };
}
