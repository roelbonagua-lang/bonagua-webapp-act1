import React from 'react';
import {
  Search,
  Plus,
  LayoutGrid,
  List,
  Menu,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { ViewMode, SortField, SortOrder } from '../types';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  clientFilter: string;
  onClientFilterChange: (client: string) => void;
  availableClients: string[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  sortBy: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField, order: SortOrder) => void;
  onOpenUpload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  clientFilter,
  onClientFilterChange,
  availableClients,
  viewMode,
  onViewModeChange,
  sortBy,
  sortOrder,
  onSortChange,
  onOpenUpload,
}) => {
  const categories: { id: string; label: string }[] = [
    { id: 'all', label: 'All Files' },
    { id: 'document', label: 'Documents' },
    { id: 'image', label: 'Images' },
    { id: 'design', label: 'Design' },
    { id: 'archive', label: 'Archives' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#080413]/90 backdrop-blur-md border-b border-fuchsia-900/40 px-4 sm:px-8 py-3.5 shadow-lg shadow-black/40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Mobile trigger & Search */}
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-[#140a28] transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/80" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search files, clients, or telemetry..."
              className="w-full pl-10 pr-9 py-2 rounded-xl border border-fuchsia-900/60 bg-[#120824] text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 p-0.5"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Right actions: Filters, View Mode, Upload button */}
        <div className="flex items-center gap-2.5 flex-wrap justify-between md:justify-end">
          {/* Client Filter */}
          {availableClients.length > 0 && (
            <div className="relative">
              <select
                value={clientFilter}
                onChange={(e) => onClientFilterChange(e.target.value)}
                className="pl-3 pr-7 py-2 text-xs font-medium bg-[#140a28] border border-fuchsia-900/60 rounded-xl text-cyan-300 hover:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer shadow-xs"
                aria-label="Filter by client"
              >
                <option value="all">All Clients ({availableClients.length})</option>
                {availableClients.map((client) => (
                  <option key={client} value={client}>
                    {client}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Selector */}
          <div className="flex items-center bg-[#140a28] border border-fuchsia-900/60 rounded-xl p-0.5 text-xs text-slate-300">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split('-') as [SortField, SortOrder];
                onSortChange(f, o);
              }}
              className="bg-transparent pl-2 pr-4 py-1.5 font-medium text-slate-300 focus:outline-none cursor-pointer"
              aria-label="Sort files"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="size-desc">Largest First</option>
              <option value="size-asc">Smallest First</option>
            </select>
          </div>

          {/* View Switcher: Table vs Grid */}
          <div className="flex items-center bg-[#140a28] p-0.5 rounded-xl border border-fuchsia-900/60">
            <button
              onClick={() => onViewModeChange('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-cyan-500 text-black font-bold shadow-sm shadow-cyan-500/50'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-cyan-500 text-black font-bold shadow-sm shadow-cyan-500/50'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
              title="Grid view"
              aria-label="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Upload button */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-fuchsia-600 to-pink-500 hover:from-cyan-400 hover:via-fuchsia-500 hover:to-pink-400 text-slate-950 font-cyber text-base font-bold tracking-wide uppercase shadow-lg shadow-cyan-500/25 border border-cyan-300/40 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Upload File</span>
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-0.5 no-scrollbar">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap uppercase tracking-wider font-mono ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950 to-fuchsia-950 text-cyan-300 border border-cyan-400/70 shadow-xs shadow-cyan-500/30'
                  : 'bg-[#120824] text-slate-400 hover:text-slate-200 border border-fuchsia-950 hover:border-fuchsia-800/60'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
