import React from 'react';
import { useLibrary, LibraryTrack } from '@/contexts/LibraryContext';
import { cn } from '@/lib/utils';
import { Clock, Disc, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TrackListProps {
    onLoadTrack: (track: any) => void;
}

export const TrackList: React.FC<TrackListProps> = ({ onLoadTrack }) => {
    const { state, removeTrack } = useLibrary();

    const [sortConfig, setSortConfig] = React.useState<{ key: keyof LibraryTrack, direction: 'asc' | 'desc' } | null>(null);

    const filteredTracks = React.useMemo(() => {
        let tracks = state.currentTracks;
        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            tracks = tracks.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.artist.toLowerCase().includes(q)
            );
        }

        if (sortConfig) {
            tracks = [...tracks].sort((a, b) => {
                const aVal = a[sortConfig.key];
                const bVal = b[sortConfig.key];

                if (typeof aVal === 'string' && typeof bVal === 'string') {
                    return sortConfig.direction === 'asc'
                        ? aVal.localeCompare(bVal)
                        : bVal.localeCompare(aVal);
                } else if (typeof aVal === 'number' && typeof bVal === 'number') {
                    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
                }
                return 0;
            });
        }
        return tracks;
    }, [state.currentTracks, state.searchQuery, sortConfig]);

    const handleSort = (key: keyof LibraryTrack) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: keyof LibraryTrack) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return <span className="ml-1 text-[#00deea] text-[10px]">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    const handleDragStart = (e: React.DragEvent, track: LibraryTrack) => {
        // Custom data format compatible with ProMixer 'drop' logic
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'track',
            id: track.id,
            title: track.title,
            artist: track.artist,
            url: track.url,
            bpm: track.bpm,
            key: track.key
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    if (state.loading) {
        return (
            <div className="h-full flex items-center justify-center text-[#555] text-xs">
                <Disc className="w-5 h-5 animate-spin mr-2" />
                Reading folder...
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-[#111]">
            <table className="w-full text-left border-collapse table-fixed">
                <thead className="sticky top-0 bg-[#1a1a1a] z-10 text-[9px] font-bold text-[#888] uppercase shadow-sm">
                    <tr>
                        <th className="w-8 px-2 py-1 border-r border-[#333] border-b text-center">#</th>
                        <th
                            className="px-2 py-1 border-r border-[#333] border-b cursor-pointer hover:bg-[#333] transition-colors"
                            onClick={() => handleSort('title')}
                        >
                            Title {getSortIndicator('title')}
                        </th>
                        <th
                            className="px-2 py-1 border-r border-[#333] border-b w-32 cursor-pointer hover:bg-[#333] transition-colors"
                            onClick={() => handleSort('artist')}
                        >
                            Artist {getSortIndicator('artist')}
                        </th>
                        <th
                            className="w-16 px-2 py-1 border-r border-[#333] border-b text-center cursor-pointer hover:bg-[#333] transition-colors"
                            onClick={() => handleSort('bpm')}
                        >
                            BPM {getSortIndicator('bpm')}
                        </th>
                        <th
                            className="w-16 px-2 py-1 border-r border-[#333] border-b text-center cursor-pointer hover:bg-[#333] transition-colors"
                            onClick={() => handleSort('key')}
                        >
                            Key {getSortIndicator('key')}
                        </th>
                        <th
                            className="w-16 px-2 py-1 border-r border-[#333] border-b text-center cursor-pointer hover:bg-[#333] transition-colors"
                            onClick={() => handleSort('time')}
                        >
                            <div className="flex items-center justify-center">
                                <Clock className="w-3 h-3" /> {getSortIndicator('time')}
                            </div>
                        </th>
                        <th className="w-8 px-2 py-1 border-b border-[#333] text-center"></th>
                    </tr>
                </thead>
                <tbody className="text-[11px] font-medium text-[#ccc]">
                    {filteredTracks.map((track, idx) => (
                        <tr
                            key={track.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, track)}
                            onDoubleClick={() => onLoadTrack(track)}
                            className={cn(
                                "group cursor-grab active:cursor-grabbing border-b border-[#1a1a1a] hover:bg-[#222] select-none",
                                idx % 2 === 0 ? "bg-[#121212]" : "bg-[#0f0f0f]"
                            )}
                        >
                            <td className="px-2 py-1 border-r border-[#1a1a1a] text-[#555] font-mono group-hover:text-[#888]">{idx + 1}</td>
                            <td className="px-2 py-1 border-r border-[#1a1a1a] text-[#fff] truncate font-semibold">{track.title}</td>
                            <td className="px-2 py-1 border-r border-[#1a1a1a] text-[#888] truncate">{track.artist}</td>
                            <td className="px-2 py-1 border-r border-[#1a1a1a] text-center font-mono text-[#00deea]">{track.bpm || '-'}</td>
                            <td className="px-2 py-1 border-r border-[#1a1a1a] text-center font-mono text-[#a855f7]">{track.key}</td>
                            <td className="px-2 py-1 border-r border-[#1a1a1a] text-center font-mono text-[#666]">{track.time}</td>
                            <td className="px-2 py-1 text-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeTrack(track.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/10 rounded-sm"
                                    title="Remove from collection"
                                >
                                    <Trash2 className="w-3 h-3 text-red-500/60 hover:text-red-500" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredTracks.length === 0 && (
                        <tr>
                            <td colSpan={6} className="text-center py-8 text-[#444] text-[10px] uppercase">
                                {state.searchQuery ? `No matches for "${state.searchQuery}"` : "Folder is empty"}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
