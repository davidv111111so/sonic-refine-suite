import React from 'react';
import { Folder, FolderOpen, HardDrive } from 'lucide-react';
import { useLibrary } from '@/contexts/LibraryContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Assuming this exists, based on previous file reads

export const BrowserPanel = () => {
    const { state, mountLibrary, importFiles, navigateToFolder } = useLibrary();

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Import Button */}
            <div className="p-2 border-b border-[#333]">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={importFiles}
                    className="w-full justify-start text-[10px] uppercase font-bold bg-[#222] border-[#444] hover:bg-[#333] text-[#ccc]"
                >
                    <HardDrive className="w-3 h-3 mr-2 text-[#00deea]" />
                    Import Files
                </Button>
            </div>

            {/* Tree View */}
            <div className="flex-1 overflow-auto p-2 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
                {!state.rootHandle ? (
                    <div className="text-[10px] text-[#555] text-center mt-4">
                        No library mounted.<br />Click above to select a music folder.
                    </div>
                ) : (
                    <div className="space-y-1">
                        <FolderItem
                            name={state.rootHandle.name}
                            handle={state.rootHandle}
                            active={true} // Root is always "base"
                            onClick={() => navigateToFolder(state.rootHandle!)}
                        />
                        {/* 
               TODO: Recursive children rendering would go here.
               For this iteration, we focus on mounting the root and reading it.
               To expand subfolders, we'd need to read the directory in the state structure.
             */}
                    </div>
                )}
            </div>
        </div>
    );
};

interface FolderItemProps {
    name: string;
    handle: FileSystemDirectoryHandle;
    active?: boolean;
    onClick: () => void;
}

const FolderItem = ({ name, active, onClick }: FolderItemProps) => (
    <div
        onClick={onClick}
        className={cn(
            "flex items-center px-2 py-1 cursor-pointer rounded-sm hover:bg-[#2a2a2a] transition-colors group",
            active ? "text-[#e0e0e0]" : "text-[#888]"
        )}
    >
        <Folder className={cn("w-3 h-3 mr-2", active ? "text-[#00deea]" : "text-[#666] group-hover:text-[#888]")} />
        <span className="text-[11px] font-medium truncate">{name}</span>
    </div>
);
