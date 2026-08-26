import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Layers, 
  BookOpen, 
  Check, 
  ChevronsDown,
  ChevronsUp
} from 'lucide-react';
import { LawTreeNode, HierarchyTreeResult } from '../utils/lawHierarchy';
import { NumeralSystem } from '../types';
import { formatNumeralText } from '../utils/thaiLawParser';

interface StructureTocModalProps {
  isOpen: boolean;
  onClose: () => void;
  treeResult: HierarchyTreeResult;
  currentFilter: string;
  onSelectFilter: (nodeId: string) => void;
  deckTitle: string;
  numeralSystem: NumeralSystem;
}

export const StructureTocModal: React.FC<StructureTocModalProps> = ({
  isOpen,
  onClose,
  treeResult,
  currentFilter,
  onSelectFilter,
  deckTitle,
  numeralSystem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  // Toggle collapse of a specific node
  const toggleCollapse = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const collapseAll = () => {
    const allParentIds = new Set<string>();
    treeResult.flatList.forEach(n => {
      if (n.children.length > 0) allParentIds.add(n.id);
    });
    setCollapsedIds(allParentIds);
  };

  const expandAll = () => {
    setCollapsedIds(new Set());
  };

  // Filter nodes if searching
  const filteredFlatList = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase().trim();
    return treeResult.flatList.filter(n => 
      n.label.toLowerCase().includes(term) ||
      n.startSection.toLowerCase().includes(term) ||
      n.endSection.toLowerCase().includes(term)
    );
  }, [searchTerm, treeResult.flatList]);

  if (!isOpen) return null;

  const renderTreeNode = (node: LawTreeNode) => {
    const isCollapsed = collapsedIds.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = currentFilter === node.id;

    // Formatting
    const displayLabel = formatNumeralText(node.label, numeralSystem);
    const displayCount = formatNumeralText(node.count.toString(), numeralSystem);
    
    const cleanStart = node.startSection.replace(/^มาตรา\s*/, '');
    const cleanEnd = node.endSection.replace(/^มาตรา\s*/, '');
    const displayRange = node.startSection === '-' 
      ? '' 
      : cleanStart === cleanEnd 
      ? `ม. ${formatNumeralText(cleanStart, numeralSystem)}` 
      : `ม. ${formatNumeralText(cleanStart, numeralSystem)}–${formatNumeralText(cleanEnd, numeralSystem)}`;

    const isBook = node.level === 'book';
    const isTitle = node.level === 'title';
    const isChapter = node.level === 'chapter';
    const paddingLeftPx = node.depth === 0 ? 12 : node.depth === 1 ? 32 : node.depth === 2 ? 52 : 72;

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={() => {
            onSelectFilter(node.id);
            onClose();
          }}
          style={{ paddingLeft: `${paddingLeftPx}px` }}
          className={`flex items-center justify-between py-2.5 pr-4 rounded-xl text-left cursor-pointer transition-all ${
            isSelected 
              ? 'bg-zinc-900 text-white font-semibold shadow-xs' 
              : isBook
              ? 'bg-zinc-50/70 hover:bg-zinc-100 text-zinc-900 font-bold border-t border-zinc-100 first:border-t-0 mt-1'
              : isTitle
              ? 'hover:bg-zinc-100 text-zinc-900 font-semibold'
              : isChapter
              ? 'hover:bg-zinc-100 text-zinc-800 font-medium'
              : 'hover:bg-zinc-100 text-zinc-600'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-3">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(node.id, e)}
                className={`p-1 -ml-1 rounded-md transition-colors ${
                  isSelected ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700'
                }`}
                title={isCollapsed ? 'ขยาย' : 'ย่อ'}
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            ) : (
              <div className="w-4 shrink-0" />
            )}

            <span className={`text-sm truncate ${
              isSelected 
                ? 'text-white font-bold' 
                : isBook 
                ? 'font-bold text-zinc-900 text-sm' 
                : isTitle 
                ? 'font-semibold text-zinc-800 text-sm' 
                : 'text-zinc-700 text-xs'
            }`}>
              {displayLabel}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 text-xs">
            {displayRange && (
              <span className={isSelected ? 'text-zinc-300' : 'text-zinc-400 font-normal'}>
                {displayRange}
              </span>
            )}
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
              isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
            }`}>
              {displayCount} มาตรา
            </span>
            {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-0.5" />}
          </div>
        </div>

        {/* Render child nodes if not collapsed */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {node.children.map(renderTreeNode)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div 
        id="structure-toc-modal"
        className="bg-white w-full max-w-2xl max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-zinc-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                สารบัญโครงสร้างกฎหมาย
              </h2>
              <p className="text-xs text-zinc-500 truncate max-w-[280px] sm:max-w-md">
                {deckTitle} ({formatNumeralText(treeResult.totalCards.toString(), numeralSystem)} มาตรา)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Quick Controls */}
        <div className="px-5 py-3 border-b border-zinc-100 flex flex-col sm:flex-row items-center gap-2.5 bg-white">
          <div className="relative w-full flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาโครงสร้าง (เช่น ลักษณะ ๒, บุคคล, มาตรา ๑๕)..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-zinc-100 hover:bg-zinc-100/80 focus:bg-white border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <button
              onClick={expandAll}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              title="ขยายทั้งหมด"
            >
              <ChevronsDown className="w-3.5 h-3.5" />
              <span>ขยาย</span>
            </button>
            <button
              onClick={collapseAll}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              title="ย่อทั้งหมด"
            >
              <ChevronsUp className="w-3.5 h-3.5" />
              <span>ย่อ</span>
            </button>
            <button
              onClick={() => {
                onSelectFilter('all');
                onClose();
              }}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                currentFilter === 'all'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>แสดงทั้งหมด</span>
            </button>
          </div>
        </div>

        {/* Tree Content */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-1 divide-y divide-zinc-100/60">
          {filteredFlatList ? (
            filteredFlatList.length > 0 ? (
              <div className="space-y-0.5">
                {filteredFlatList.map(node => {
                  const cleanStart = node.startSection.replace(/^มาตรา\s*/, '');
                  const cleanEnd = node.endSection.replace(/^มาตรา\s*/, '');
                  const displayRange = node.startSection === '-' 
                    ? '' 
                    : cleanStart === cleanEnd 
                    ? `ม. ${formatNumeralText(cleanStart, numeralSystem)}` 
                    : `ม. ${formatNumeralText(cleanStart, numeralSystem)}–${formatNumeralText(cleanEnd, numeralSystem)}`;

                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        onSelectFilter(node.id);
                        onClose();
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                        currentFilter === node.id
                          ? 'bg-zinc-900 text-white font-semibold'
                          : 'hover:bg-zinc-100 text-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 mr-3">
                        <span className="text-xs truncate font-medium">
                          {formatNumeralText(node.label, numeralSystem)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 text-xs">
                        {displayRange && (
                          <span className={currentFilter === node.id ? 'text-zinc-300' : 'text-zinc-400'}>
                            {displayRange}
                          </span>
                        )}
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          currentFilter === node.id ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {formatNumeralText(node.count.toString(), numeralSystem)} มาตรา
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-400">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">ไม่พบโครงสร้างที่ตรงกับคำค้นหา "{searchTerm}"</p>
              </div>
            )
          ) : (
            treeResult.rootNodes.length > 0 ? (
              treeResult.rootNodes.map(renderTreeNode)
            ) : (
              <div className="py-12 text-center text-zinc-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">สำรับนี้ยังไม่มีการจัดหมวดหมู่โครงสร้าง</p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span>คลิกที่หมวดหมู่เพื่อกรองอ่านเฉพาะมาตราในหมวดนั้น</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-semibold rounded-xl transition-colors cursor-pointer"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
