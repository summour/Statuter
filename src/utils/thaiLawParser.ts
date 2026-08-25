import { LawParagraph, ParsedLawSection, ImportAuditReport, LawCard } from '../types';

// Convert Thai numerals string to standard Arabic number string
export function thaiToArabicDigits(str: string): string {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  let res = str;
  thaiDigits.forEach((digit, index) => {
    res = res.replaceAll(digit, index.toString());
  });
  return res;
}

// Convert Arabic digits to Thai digits
export function arabicToThaiDigits(str: string): string {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  let res = str;
  for (let i = 0; i <= 9; i++) {
    res = res.replaceAll(i.toString(), thaiDigits[i]);
  }
  return res;
}

// Calculate sortable raw number from section string (e.g. "มาตรา ๑๙๓/๑" -> 193.001)
export function parseRawSectionNumber(secStr: string): number {
  const arabicStr = thaiToArabicDigits(secStr);
  const match = arabicStr.match(/(\d+)(?:\/(\d+))?/);
  if (!match) return 0;
  const main = parseInt(match[1], 10);
  const sub = match[2] ? parseInt(match[2], 10) / 1000 : 0;
  return main + sub;
}

// Check if a line is a legal hierarchy header (บรรพ, ภาค, ลักษณะ, หมวด, ส่วนที่)
interface HierarchyMatch {
  type: 'law_title' | 'book' | 'titleStructure' | 'chapter' | 'part';
  fullLabel: string;
}

function matchHierarchy(line: string, nextLine?: string): HierarchyMatch | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // 1. บรรพ / ภาค
  if (/^(?:บรรพ|ภาค)\s*([0-9\u0E50-\u0E59]+|[^\n]+)/u.test(trimmed)) {
    let full = trimmed;
    if (nextLine && nextLine.trim() && !matchHierarchy(nextLine) && !isSectionHeader(nextLine)) {
      full = `${trimmed} ${nextLine.trim()}`;
    }
    return { type: 'book', fullLabel: full };
  }

  // 2. ลักษณะ
  if (/^ลักษณะ\s*([0-9\u0E50-\u0E59]+|[^\n]+)/u.test(trimmed)) {
    let full = trimmed;
    if (nextLine && nextLine.trim() && !matchHierarchy(nextLine) && !isSectionHeader(nextLine)) {
      full = `${trimmed} ${nextLine.trim()}`;
    }
    return { type: 'titleStructure', fullLabel: full };
  }

  // 3. หมวด
  if (/^หมวด\s*([0-9\u0E50-\u0E59]+|[^\n]+)/u.test(trimmed)) {
    let full = trimmed;
    if (nextLine && nextLine.trim() && !matchHierarchy(nextLine) && !isSectionHeader(nextLine)) {
      full = `${trimmed} ${nextLine.trim()}`;
    }
    return { type: 'chapter', fullLabel: full };
  }

  // 4. ส่วนที่ / ส่วน
  if (/^ส่วน(?:ที่)?\s*([0-9\u0E50-\u0E59]+|[^\n]+)/u.test(trimmed)) {
    let full = trimmed;
    if (nextLine && nextLine.trim() && !matchHierarchy(nextLine) && !isSectionHeader(nextLine)) {
      full = `${trimmed} ${nextLine.trim()}`;
    }
    return { type: 'part', fullLabel: full };
  }

  // 5. Law Title in first few lines
  if (/^(?:ประมวลกฎหมาย|พระราชบัญญัติ|พระราชกำหนด|รัฐธรรมนูญแห่งราชอาณาจักรไทย)/.test(trimmed)) {
    return { type: 'law_title', fullLabel: trimmed };
  }

  return null;
}

// Regex to identify starting line of section: e.g. "มาตรา ๑", "มาตรา 193/1", "มาตรา ๑๐๙๖ ทวิ[53]"
const SECTION_START_REGEX = /^[\s\t]*(มาตรา\s*([0-9\u0E50-\u0E59]+(?:\/[0-9\u0E50-\u0E59]+)?(?:\s*(?:ทวิ|ตรี|จัตวา|เบญจ|ฉ|สัตต|อัฏฐ|นว|ทศ))?))(?:\[(\d+)\])?\s*([\s\S]*)$/u;

export function isSectionHeader(line: string): boolean {
  return SECTION_START_REGEX.test(line.trim());
}

// Identify end-matter headers: Footnotes, Amending Acts (พ.ร.บ. แก้ไขเพิ่มเติม), etc.
export function isEndMatterHeader(line: string): boolean {
  const trimmed = line.trim();
  return (
    /^(?:พระราชบัญญัติแก้ไขเพิ่มเติม|พระราชบัญญัติให้ใช้|พระราชกำหนด|ประกาศคณะปฏิวัติ|เชิงอรรถ|หมายเหตุ\s*:-|\[\d+\]\s*ราชกิจจานุเบกษา)/u.test(trimmed)
  );
}

// Extract paragraphs (วรรค / อนุมาตรา) accurately from verbatim section text
export function extractParagraphs(fullText: string): LawParagraph[] {
  if (!fullText || !fullText.trim()) return [];

  const rawLines = fullText.split('\n');
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
      if (combinedText) {
        paragraphs.push({
          label: currentLabel,
          text: combinedText,
        });
      }
      currentLabel = '';
      currentTextLines = [];
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      // Empty line signals explicit separation
      flush();
      continue;
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

  let currentLawName = 'ประมวลกฎหมายแพ่งและพาณิชย์';
  let currentBook = '';
  let currentTitleStructure = '';
  let currentChapter = '';
  let currentPart = '';

  let currentSectionNumber = '';
  let currentSectionRawNum = 0;
  let currentSectionLines: string[] = [];
  let currentStartLine = 1;
  let currentFootnoteTag = '';
  let insideEndMatter = false;

  const seenSectionNumbers = new Set<string>();
  const duplicateSectionNumbers = new Set<string>();

  // Helper to commit current accumulated section
  const commitSection = () => {
    if (!currentSectionNumber) return;

    // Join verbatim text preserving original structure
    const rawFullText = currentSectionLines.join('\n').trim();

    // Check uncertainty & errors
    let status: ParsedLawSection['status'] = 'valid';
    let uncertaintyReason: string | undefined;
    let errorDetail: string | undefined;

    const isInserted = /[\/]|ทวิ|ตรี|จัตวา|เบญจ|ฉ|สัตต|อัฏฐ|นว|ทศ/u.test(currentSectionNumber);
    const isRepealed = rawFullText.includes('(ยกเลิก)') || rawFullText.includes('ยกเลิกโดย') || rawFullText.includes('[ยกเลิก]') || rawFullText.trim() === '(ยกเลิก)' || rawFullText.trim() === 'ยกเลิก';
    const isPrimarySection = !isInserted;

    const isEmpty = rawFullText.length === 0;
    const isVeryShort = rawFullText.length < 5 && !isRepealed;
    const hasUnclosedBracket = (rawFullText.match(/\[/g) || []).length !== (rawFullText.match(/\]/g) || []).length;
    
    // Check duplication with file itself
    const normalizedSecNum = thaiToArabicDigits(currentSectionNumber).replace(/\s+/g, '');
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

    const paragraphs = extractParagraphs(rawFullText);

    // Auto-detect short title if first line is in quotes or has pattern
    let extractedTitle: string | undefined;
    const firstLine = currentSectionLines[0] || '';
    const quoteMatch = firstLine.match(/คำว่า\s*[“"']([^”"']+)["'”]/);
    if (quoteMatch) {
      extractedTitle = quoteMatch[1];
    } else if (rawFullText.includes('หมายความว่า')) {
      const defMatch = rawFullText.match(/^([^\s]+)\s+หมายความว่า/);
      if (defMatch) extractedTitle = defMatch[1];
    }

    const parsedSec: ParsedLawSection = {
      tempId: `sec_${Date.now()}_${sections.length + 1}_${Math.random().toString(36).substring(2, 7)}`,
      sectionNumber: currentSectionNumber + (currentFootnoteTag ? ` ${currentFootnoteTag}` : ''),
      sectionRawNum: currentSectionRawNum,
      book: currentBook || undefined,
      titleStructure: currentTitleStructure || undefined,
      chapter: currentChapter || undefined,
      part: currentPart || undefined,
      title: extractedTitle,
      fullText: rawFullText,
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
    currentFootnoteTag = '';
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
        const secNum = match[1].trim();
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

    // Check for Section Header: "มาตรา ๑..."
    const secMatch = trimmedLine.match(SECTION_START_REGEX);
    if (secMatch) {
      // Commit previous section first
      commitSection();

      currentStartLine = i + 1;
      currentSectionNumber = secMatch[1].trim();
      currentSectionRawNum = parseRawSectionNumber(secMatch[2].trim());
      currentFootnoteTag = secMatch[3] || '';

      const inlineText = (secMatch[4] || '').trim();
      if (inlineText) {
        currentSectionLines.push(inlineText);
      }
      i++;
      continue;
    }

    // Check for Hierarchy (บรรพ, ลักษณะ, หมวด, ส่วนที่, พระราชบัญญัติ)
    const nextLine = i + 1 < lines.length ? lines[i + 1] : undefined;
    const hier = matchHierarchy(trimmedLine, nextLine);
    if (hier) {
      // If we are currently collecting section text and hit hierarchy, commit section
      commitSection();

      let linesToSkip = 1;
      // If hierarchy absorbed next line as title
      if (nextLine && nextLine.trim() && hier.fullLabel.includes(nextLine.trim())) {
        linesToSkip = 2;
      }

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

      i += linesToSkip;
      continue;
    }

    // Otherwise, this line is part of the current active section body
    if (currentSectionNumber) {
      currentSectionLines.push(trimmedLine);
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

  // Calculate Breakdown by Book
  const bookCountMap = new Map<string, number>();
  for (const sec of sections) {
    const bookName = sec.book || 'บททั่วไป / ไม่ระบุบรรพ';
    bookCountMap.set(bookName, (bookCountMap.get(bookName) || 0) + 1);
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
