import React from 'react';
import { useLibrary, LibraryTrack } from '@/contexts/LibraryContext';
import { cn } from '@/lib/utils';
import { Clock, Disc } from 'lucide-react';
import { toast } from 'sonner';

interface TrackListProps {
    onLoadTrack: (track: any) => void;
}

export const TrackList: React.FC<TrackListProps> = ({ onLoadTrack }) => {
    const { state } = useLibrary();

    const filteredTracks = React.useMemo(() => {
        if (!state.searchQuery) return state.currentTracks;
        const q = state.searchQuery.toLowerCase();
        return state.currentTracks.filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.artist.toLowerCase().includes(q)
        );
    }, [state.currentTracks, state.searchQuery]);

    const handleDragStart = (e: React.DragEvent, track: LibraryTrack) => {
        // Custom data format compatible with ProMixer 'drop' logic
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'track',
            title: track.title,
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
                        <th className="w-10 px-2 py-1 border-r border-[#333] border-b">#</th>
                        <th className="px-2 py-1 border-r border-[#333] border-b">Title</th>
                        <th className="px-2 py-1 border-r border-[#333] border-b">Artist</th>
                        <th className="w-16 px-2 py-1 border-r border-[#333] border-b text-center">BPM</th>
                        <th className="w-16 px-2 py-1 border-r border-[#333] border-b text-center">Key</th>
                        <th className="w-16 px-2 py-1 border-b border-[#333] text-center">
                            <Clock className="w-3 h-3 mx-auto" />
                        </th>
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
                            <td className="px-2 py-1 text-center font-mono text-[#666]">{track.time}</td>
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
