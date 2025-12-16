import React from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { BrowserPanel } from './BrowserPanel';
import { TrackList } from './TrackList';
import { useLibrary } from '@/contexts/LibraryContext';
import { Search } from 'lucide-react';
import { LibraryTrack } from '@/contexts/LibraryContext';

interface LibraryBrowserProps {
    onLoadTrack: (track: any) => void;
}

export const LibraryBrowser: React.FC<LibraryBrowserProps> = ({ onLoadTrack }) => {
    const { state, setSearch } = useLibrary();

    return (
        <div className="h-full flex flex-col bg-[#1e1e1e]">
            {/* Search Bar / Header */}
            <div className="h-8 bg-[#262626] border-b border-[#333] flex items-center px-2 gap-2 flex-shrink-0">
                <span className="text-[10px] font-bold text-[#666] uppercase tracking-widest mr-2">LIBRARY</span>
                <div className="flex items-center bg-[#121212] border border-[#333] h-6 w-full max-w-md px-2 rounded-sm focus-within:border-[#00deea]">
                    <Search className="w-3 h-3 text-[#555] mr-2" />
                    <input
                        className="bg-transparent border-none outline-none text-[11px] text-[#e0e0e0] w-full placeholder:text-[#444]"
                        placeholder="SEARCH COLLECTION"
                        value={state.searchQuery}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {state.analyzingCount > 0 && (
                    <span className="text-[9px] text-[#00deea] animate-pulse ml-auto">
                        ANALYZING {state.analyzingCount} TRACKS...
                    </span>
                )}
            </div>

            {/* Main Split View */}
            <div className="flex-1 min-h-0">
                <PanelGroup direction="horizontal">
                    <Panel defaultSize={20} minSize={15} maxSize={40} className="bg-[#181818] border-r border-[#333]">
                        <BrowserPanel />
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-[#333] hover:bg-[#00deea] transition-colors cursor-col-resize" />

                    <Panel defaultSize={80} className="bg-[#0d0d0d]">
                        <TrackList onLoadTrack={onLoadTrack} />
                    </Panel>
                </PanelGroup>
            </div>
        </div>
    );
};
