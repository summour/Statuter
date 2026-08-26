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

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'book':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 text-purple-800 border border-purple-200">บรรพ/ภาค</span>;
      case 'title':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-800 border border-blue-200">ลักษณะ</span>;
      case 'chapter':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-teal-100 text-teal-800 border border-teal-200">หมวด</span>;
      case 'part':
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">ส่วน</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">อื่นๆ</span>;
    }
  };

  const renderTreeNode = (node: LawTreeNode) => {
    const isCollapsed = collapsedIds.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = currentFilter === node.id;

    // Formatting
    const displayLabel = formatNumeralText(node.label, numeralSystem);
    const displayCount = formatNumeralText(node.count.toString(), numeralSystem);
    const displayStart = formatNumeralText(node.startSection, numeralSystem);
    const displayEnd = formatNumeralText(node.endSection, numeralSystem);
    const rangeText = displayStart === displayEnd ? displayStart : `${displayStart} - ${displayEnd}`;

    // Depth indentation
    const indentPadding = node.depth === 0 ? 'pl-3' : node.depth === 1 ? 'pl-7' : node.depth === 2 ? 'pl-11' : 'pl-16';

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={() => {
            onSelectFilter(node.id);
            onClose();
          }}
          className={`flex items-center justify-between py-2.5 pr-3 ${indentPadding} rounded-xl text-left cursor-pointer transition-all ${
            isSelected 
              ? 'bg-zinc-900 text-white font-semibold shadow-xs' 
              : 'hover:bg-zinc-100 text-zinc-800'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(node.id, e)}
                className={`p-1 rounded-md transition-colors ${
                  isSelected ? 'hover:bg-zinc-800 text-zinc-300' : 'hover:bg-zinc-200 text-zinc-500'
                }`}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-5.5" />
            )}

            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              {getLevelBadge(node.level)}
              <span className={`text-xs truncate ${isSelected ? 'text-white font-bold' : 'text-zinc-800 font-medium'}`}>
                {displayLabel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {node.startSection !== '-' && (
              <span className={`text-[11px] px-2 py-0.5 rounded-md ${
                isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
              }`}>
                {rangeText}
              </span>
            )}
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isSelected ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
            }`}>
              {displayCount} มาตรา
            </span>
            {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-1" />}
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
              <div className="space-y-1">
                {filteredFlatList.map(node => (
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
                    <div className="flex items-center gap-2 min-w-0 mr-2">
                      {getLevelBadge(node.level)}
                      <span className="text-xs truncate font-medium">
                        {formatNumeralText(node.label, numeralSystem)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {node.startSection !== '-' && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-md ${
                          currentFilter === node.id ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {formatNumeralText(node.startSection, numeralSystem)} - {formatNumeralText(node.endSection, numeralSystem)}
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        currentFilter === node.id ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
                      }`}>
                        {formatNumeralText(node.count.toString(), numeralSystem)} มาตรา
                      </span>
                    </div>
                  </div>
                ))}
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
