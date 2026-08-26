import { LawCard, NumeralSystem } from '../types';
import { formatNumeralText, parseRawSectionNumber } from './thaiLawParser';

export type HierarchyLevel = 'book' | 'title' | 'chapter' | 'part' | 'uncategorized';

export interface LawTreeNode {
  id: string;
  level: HierarchyLevel;
  label: string;
  depth: number;
  startSection: string;
  endSection: string;
  firstSectionNum: number;
  count: number;
  book?: string;
  titleStructure?: string;
  chapter?: string;
  part?: string;
  children: LawTreeNode[];
}

export interface HierarchyTreeResult {
  rootNodes: LawTreeNode[];
  flatList: LawTreeNode[];
  hasMultipleStructures: boolean;
  totalCards: number;
  uncategorizedCount: number;
}

/**
 * Builds a natural legal statute hierarchy tree (Book -> Title -> Chapter -> Part)
 * preserving chronological statutory sequence.
 */
export function buildLawHierarchyTree(cards: LawCard[]): HierarchyTreeResult {
  if (!cards || cards.length === 0) {
    return {
      rootNodes: [],
      flatList: [],
      hasMultipleStructures: false,
      totalCards: 0,
      uncategorizedCount: 0,
    };
  }

  // Ensure cards are in statutory order
  const sortedCards = [...cards].sort((a, b) => {
    const numA = typeof a.sectionRawNum === 'number' && !isNaN(a.sectionRawNum) ? a.sectionRawNum : parseRawSectionNumber(a.sectionNumber);
    const numB = typeof b.sectionRawNum === 'number' && !isNaN(b.sectionRawNum) ? b.sectionRawNum : parseRawSectionNumber(b.sectionNumber);
    if (numA !== numB) return numA - numB;
    return a.sectionNumber.localeCompare(b.sectionNumber, 'th');
  });

  const rootNodes: LawTreeNode[] = [];
  const map = new Map<string, LawTreeNode>();
  let uncategorizedCount = 0;

  for (const c of sortedCards) {
    const secNum = typeof c.sectionRawNum === 'number' && !isNaN(c.sectionRawNum) ? c.sectionRawNum : parseRawSectionNumber(c.sectionNumber);
    const book = c.book && c.book.trim().length <= 90 ? c.book.trim() : undefined;
    const title = c.titleStructure && c.titleStructure.trim().length <= 90 ? c.titleStructure.trim() : undefined;
    const chapter = c.chapter && c.chapter.trim().length <= 90 ? c.chapter.trim() : undefined;
    const part = c.part && c.part.trim().length <= 90 ? c.part.trim() : undefined;

    if (!book && !title && !chapter && !part) {
      uncategorizedCount++;
      continue;
    }

    let parentId = '';

    // 1. Level: Book / ภาค / บรรพ
    if (book) {
      const bookId = `book:${book}`;
      if (!map.has(bookId)) {
        const node: LawTreeNode = {
          id: bookId,
          level: 'book',
          label: book,
          depth: 0,
          startSection: c.sectionNumber,
          endSection: c.sectionNumber,
          firstSectionNum: secNum,
          count: 0,
          book,
          children: [],
        };
        map.set(bookId, node);
        rootNodes.push(node);
      }
      const bNode = map.get(bookId)!;
      bNode.count++;
      bNode.endSection = c.sectionNumber;
      parentId = bookId;
    }

    // 2. Level: Title / ลักษณะ
    if (title) {
      const titleKey = book ? `${book}::${title}` : title;
      const titleId = `title:${titleKey}`;
      if (!map.has(titleId)) {
        const parent = parentId ? map.get(parentId) : null;
        const depth = parent ? parent.depth + 1 : 0;
        const node: LawTreeNode = {
          id: titleId,
          level: 'title',
          label: title,
          depth,
          startSection: c.sectionNumber,
          endSection: c.sectionNumber,
          firstSectionNum: secNum,
          count: 0,
          book,
          titleStructure: title,
          children: [],
        };
        map.set(titleId, node);
        if (parent) parent.children.push(node);
        else rootNodes.push(node);
      }
      const tNode = map.get(titleId)!;
      tNode.count++;
      tNode.endSection = c.sectionNumber;
      parentId = titleId;
    }

    // 3. Level: Chapter / หมวด
    if (chapter) {
      const chapterKey = `${book || ''}::${title || ''}::${chapter}`;
      const chapterId = `chapter:${chapterKey}`;
      if (!map.has(chapterId)) {
        const parent = parentId ? map.get(parentId) : null;
        const depth = parent ? parent.depth + 1 : 0;
        const node: LawTreeNode = {
          id: chapterId,
          level: 'chapter',
          label: chapter,
          depth,
          startSection: c.sectionNumber,
          endSection: c.sectionNumber,
          firstSectionNum: secNum,
          count: 0,
          book,
          titleStructure: title,
          chapter,
          children: [],
        };
        map.set(chapterId, node);
        if (parent) parent.children.push(node);
        else rootNodes.push(node);
      }
      const cNode = map.get(chapterId)!;
      cNode.count++;
      cNode.endSection = c.sectionNumber;
      parentId = chapterId;
    }

    // 4. Level: Part / ส่วน
    if (part) {
      const partKey = `${book || ''}::${title || ''}::${chapter || ''}::${part}`;
      const partId = `part:${partKey}`;
      if (!map.has(partId)) {
        const parent = parentId ? map.get(parentId) : null;
        const depth = parent ? parent.depth + 1 : 0;
        const node: LawTreeNode = {
          id: partId,
          level: 'part',
          label: part,
          depth,
          startSection: c.sectionNumber,
          endSection: c.sectionNumber,
          firstSectionNum: secNum,
          count: 0,
          book,
          titleStructure: title,
          chapter,
          part,
          children: [],
        };
        map.set(partId, node);
        if (parent) parent.children.push(node);
        else rootNodes.push(node);
      }
      const pNode = map.get(partId)!;
      pNode.count++;
      pNode.endSection = c.sectionNumber;
    }
  }

  // Flatten Depth-First Search (Chronological statute book order)
  const flatList: LawTreeNode[] = [];
  function traverse(nodes: LawTreeNode[]) {
    for (const n of nodes) {
      flatList.push(n);
      if (n.children.length > 0) traverse(n.children);
    }
  }
  traverse(rootNodes);

  // If there are uncategorized cards, add a node at the end
  if (uncategorizedCount > 0 && flatList.length > 0) {
    const uncatNode: LawTreeNode = {
      id: 'uncategorized',
      level: 'uncategorized',
      label: 'ไม่มีหมวดหมู่ระบุ',
      depth: 0,
      startSection: '-',
      endSection: '-',
      firstSectionNum: 999999,
      count: uncategorizedCount,
      children: [],
    };
    rootNodes.push(uncatNode);
    flatList.push(uncatNode);
  }

  const hasMultipleStructures = flatList.length > 1;

  return {
    rootNodes,
    flatList,
    hasMultipleStructures,
    totalCards: sortedCards.length,
    uncategorizedCount,
  };
}

/**
 * Filter cards matching a specific hierarchy node
 */
export function filterCardsByHierarchyNode(cards: LawCard[], nodeId: string): LawCard[] {
  if (!nodeId || nodeId === 'all') return cards;

  if (nodeId === 'uncategorized') {
    return cards.filter(c => !c.book && !c.titleStructure && !c.chapter && !c.part);
  }

  if (nodeId.startsWith('book:')) {
    const bookName = nodeId.slice(5);
    return cards.filter(c => c.book === bookName);
  }

  if (nodeId.startsWith('title:')) {
    const raw = nodeId.slice(6);
    if (raw.includes('::')) {
      const [book, title] = raw.split('::');
      return cards.filter(c => c.titleStructure === title && (c.book === book || !c.book));
    }
    return cards.filter(c => c.titleStructure === raw);
  }

  if (nodeId.startsWith('chapter:')) {
    const raw = nodeId.slice(8);
    const parts = raw.split('::');
    if (parts.length >= 3) {
      const [book, title, chapter] = parts;
      return cards.filter(c => {
        const chMatch = c.chapter === chapter || (!c.chapter && chapter === 'บททั่วไป');
        const tMatch = !title || c.titleStructure === title || !c.titleStructure;
        const bMatch = !book || c.book === book || !c.book;
        return chMatch && tMatch && bMatch;
      });
    }
    return cards.filter(c => c.chapter === raw || (!c.chapter && raw === 'บททั่วไป'));
  }

  if (nodeId.startsWith('part:')) {
    const raw = nodeId.slice(5);
    const parts = raw.split('::');
    if (parts.length >= 4) {
      const [book, title, chapter, part] = parts;
      return cards.filter(c => {
        const pMatch = c.part === part;
        const chMatch = !chapter || c.chapter === chapter || !c.chapter;
        const tMatch = !title || c.titleStructure === title || !c.titleStructure;
        const bMatch = !book || c.book === book || !c.book;
        return pMatch && chMatch && tMatch && bMatch;
      });
    }
    return cards.filter(c => c.part === raw);
  }

  return cards;
}

/**
 * Format tree node label with hierarchy indentation for select elements
 */
export function formatTreeOptionLabel(node: LawTreeNode, numeralSystem: NumeralSystem): string {
  const formattedLabel = formatNumeralText(node.label, numeralSystem);
  const formattedCount = formatNumeralText(node.count.toString(), numeralSystem);

  let prefix = '';
  if (node.depth === 1) prefix = '  └ ';
  else if (node.depth === 2) prefix = '    • ';
  else if (node.depth === 3) prefix = '       - ';
  else if (node.depth >= 4) prefix = '          · ';

  return `${prefix}${formattedLabel} (${formattedCount})`;
}
