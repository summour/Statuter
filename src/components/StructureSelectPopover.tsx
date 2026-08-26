import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Layers, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  Search, 
  X, 
  Maximize2
} from 'lucide-react';
import { LawTreeNode, HierarchyTreeResult } from '../utils/lawHierarchy';
import { NumeralSystem } from '../types';
import { formatNumeralText } from '../utils/thaiLawParser';

interface StructureSelectPopoverProps {
  treeResult: HierarchyTreeResult;
  currentFilter: string;
  onSelectFilter: (nodeId: string) => void;
  onOpenFullToc: () => void;
  numeralSystem: NumeralSystem;
}

export const StructureSelectPopover: React.FC<StructureSelectPopoverProps> = ({
  treeResult,
  currentFilter,
  onSelectFilter,
  onOpenFullToc,
  numeralSystem,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Find currently selected node for the trigger label
  const selectedNode = useMemo(() => {
    if (currentFilter === 'all') return null;
    return treeResult.flatList.find(n => n.id === currentFilter) || null;
  }, [currentFilter, treeResult.flatList]);

  // Toggle collapse
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

  // Search filtering
  const filteredList = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.toLowerCase().trim();
    return treeResult.flatList.filter(n => 
      n.label.toLowerCase().includes(term) ||
      n.startSection.toLowerCase().includes(term) ||
      n.endSection.toLowerCase().includes(term) ||
      (n.book && n.book.toLowerCase().includes(term)) ||
      (n.titleStructure && n.titleStructure.toLowerCase().includes(term))
    );
  }, [searchTerm, treeResult.flatList]);

  // Clean, uncluttered tree rendering with full-width rows
  const renderItem = (node: LawTreeNode) => {
    const isCollapsed = collapsedIds.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = currentFilter === node.id;

    const displayLabel = formatNumeralText(node.label, numeralSystem);
    const displayCount = formatNumeralText(node.count.toString(), numeralSystem);
    
    // Short section range (e.g., "ม. 15–136")
    const cleanStart = node.startSection.replace(/^มาตรา\s*/, '');
    const cleanEnd = node.endSection.replace(/^มาตรา\s*/, '');
    const displayRange = node.startSection === '-' 
      ? '' 
      : cleanStart === cleanEnd 
      ? `ม. ${formatNumeralText(cleanStart, numeralSystem)}` 
      : `ม. ${formatNumeralText(cleanStart, numeralSystem)}–${formatNumeralText(cleanEnd, numeralSystem)}`;

    // Level-specific text weights and indent
    const isBook = node.level === 'book';
    const isTitle = node.level === 'title';
    const isChapter = node.level === 'chapter';

    const paddingLeftPx = node.depth === 0 ? 8 : node.depth === 1 ? 24 : node.depth === 2 ? 40 : 54;

    return (
      <div key={node.id} className="flex flex-col">
        <div
          onClick={() => {
            onSelectFilter(node.id);
            setIsOpen(false);
          }}
          style={{ paddingLeft: `${paddingLeftPx}px` }}
          className={`flex items-center justify-between py-2 pr-3 rounded-lg text-left cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-zinc-900 text-white font-semibold' 
              : isBook
              ? 'hover:bg-zinc-100 text-zinc-900 font-bold bg-zinc-50/50 mt-1 border-t border-zinc-100 first:border-t-0'
              : isTitle
              ? 'hover:bg-zinc-100 text-zinc-900 font-medium'
              : isChapter
              ? 'hover:bg-zinc-100 text-zinc-800'
              : 'hover:bg-zinc-100 text-zinc-600'
          }`}
        >
          {/* Left: Chevron + Title */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-3">
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(node.id, e)}
                className={`p-1 -ml-1 rounded hover:bg-black/10 transition-colors shrink-0 ${
                  isSelected ? 'text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
                }`}
                title={isCollapsed ? 'ขยาย' : 'ย่อ'}
              >
                {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <div className="w-3.5 shrink-0" />
            )}

            <span className={`truncate text-xs ${
              isSelected 
                ? 'text-white' 
                : isBook 
                ? 'font-bold text-zinc-900' 
                : isTitle 
                ? 'font-semibold text-zinc-800' 
                : isChapter 
                ? 'font-medium text-zinc-700' 
                : 'text-zinc-600'
            }`}>
              {displayLabel}
            </span>
          </div>

          {/* Right: Clean, uncrowded range and count */}
          <div className="flex items-center gap-2 shrink-0 text-[11px]">
            {displayRange && (
              <span className={isSelected ? 'text-zinc-300' : 'text-zinc-400 font-normal'}>
                {displayRange}
              </span>
            )}
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              isSelected ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
            }`}>
              {displayCount}
            </span>
            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-0.5" />}
          </div>
        </div>

        {/* Children if not collapsed */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {node.children.map(renderItem)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative inline-block text-left">
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        id="structure-custom-dropdown-trigger"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 border rounded-xl text-xs font-medium transition-all cursor-pointer shadow-2xs max-w-[220px] sm:max-w-[320px] ${
          isOpen
            ? 'bg-zinc-900 text-white border-zinc-900 ring-2 ring-zinc-900/10'
            : currentFilter !== 'all'
            ? 'bg-zinc-100 text-zinc-900 border-zinc-300 hover:bg-zinc-200'
            : 'bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200'
        }`}
        title="เลือกโครงสร้างกฎหมาย"
      >
        <Layers className={`w-3.5 h-3.5 shrink-0 ${isOpen ? 'text-zinc-300' : 'text-zinc-500'}`} />
        
        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
          <span className="truncate">
            {selectedNode ? formatNumeralText(selectedNode.label, numeralSystem) : 'โครงสร้างทั้งหมด'}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-semibold ${
            isOpen ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-100 text-zinc-600'
          }`}>
            {formatNumeralText(
              selectedNode ? selectedNode.count.toString() : treeResult.totalCards.toString(),
              numeralSystem
            )}
          </span>
        </div>

        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180 text-zinc-300' : 'text-zinc-400'}`} />
      </button>

      {/* Popover Menu Dropdown */}
      {isOpen && (
        <div
          ref={popoverRef}
          id="structure-custom-dropdown-menu"
          className="absolute left-0 sm:right-auto mt-1.5 w-[340px] sm:w-[460px] max-h-[460px] bg-white rounded-2xl shadow-xl border border-zinc-200 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Clean Search header */}
          <div className="p-2.5 border-b border-zinc-100 bg-zinc-50/70 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาโครงสร้าง หรือเลขมาตรา..."
                autoFocus
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onOpenFullToc();
              }}
              className="flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-zinc-900 px-2.5 py-1.5 rounded-lg hover:bg-zinc-200/80 transition-colors cursor-pointer shrink-0"
              title="เปิดสารบัญเต็มหน้าจอ"
            >
              <Maximize2 className="w-3.5 h-3.5 text-zinc-500" />
              <span>สารบัญเต็ม</span>
            </button>
          </div>

          {/* Quick "Show All" bar */}
          <div className="px-2.5 py-1.5 border-b border-zinc-100 bg-white flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                onSelectFilter('all');
                setIsOpen(false);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                currentFilter === 'all'
                  ? 'bg-zinc-900 text-white font-semibold'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>แสดงทั้งหมด ({formatNumeralText(treeResult.totalCards.toString(), numeralSystem)} มาตรา)</span>
            </button>
          </div>

          {/* Hierarchical Tree List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {filteredList ? (
              filteredList.length > 0 ? (
                <div className="space-y-0.5">
                  {filteredList.map(node => {
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
                          setIsOpen(false);
                        }}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                          currentFilter === node.id
                            ? 'bg-zinc-900 text-white font-semibold'
                            : 'hover:bg-zinc-100 text-zinc-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 mr-2">
                          <span className="truncate font-medium">
                            {formatNumeralText(node.label, numeralSystem)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[11px]">
                          {displayRange && (
                            <span className={currentFilter === node.id ? 'text-zinc-300' : 'text-zinc-400'}>
                              {displayRange}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            currentFilter === node.id ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-100 text-zinc-600'
                          }`}>
                            {formatNumeralText(node.count.toString(), numeralSystem)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center text-zinc-400 text-xs">
                  ไม่พบโครงสร้าง "{searchTerm}"
                </div>
              )
            ) : (
              treeResult.rootNodes.map(renderItem)
            )}
          </div>
        </div>
      )}
    </div>
  );
};
