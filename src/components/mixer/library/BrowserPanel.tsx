import React from 'react';
import { Folder, FolderOpen, HardDrive, ChevronRight, ChevronDown } from 'lucide-react';
import { useLibrary } from '@/contexts/LibraryContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const BrowserPanel = () => {
    const { state, importFiles, toggleFolder, mountLibrary } = useLibrary();

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Import Controls */}
            <div className="p-2 border-b border-[#333] flex flex-col gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mountLibrary()}
                    className="w-full justify-start text-[10px] uppercase font-bold bg-[#121212] border-[#00deea]/30 hover:bg-[#00deea]/10 text-[#00deea]"
                >
                    <FolderOpen className="w-3 h-3 mr-2 text-[#00deea]" />
                    Mount Folder
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={importFiles}
                    className="w-full justify-start text-[10px] uppercase font-bold bg-[#222] border-[#444] hover:bg-[#333] text-[#ccc]"
                >
                    <HardDrive className="w-3 h-3 mr-2 text-neutral-500" />
                    Import Files
                </Button>
            </div>

            {/* Tree View */}
            <div className="flex-1 overflow-auto py-2 scrollbar-thin scrollbar-thumb-[#333] scrollbar-track-transparent">
                {!state.fileTree ? (
                    <div className="text-[10px] text-[#555] text-center mt-4 px-2">
                        No library mounted.<br />Import folder to begin.
                    </div>
                ) : (
                    <div className="space-y-0.5">
                        <FolderTreeItem node={state.fileTree} depth={0} onToggle={toggleFolder} />
                    </div>
                )}
            </div>
        </div>
    );
};

interface FolderTreeItemProps {
    node: any; // Using any for simplicity in recursive tree
    depth: number;
    onToggle: (node: any) => void;
}

const FolderTreeItem = ({ node, depth, onToggle }: FolderTreeItemProps) => {
    const hasChildren = node.children && node.children.length > 0;
    const paddingLeft = depth * 12 + 6;

    return (
        <>
            <div
                onClick={() => onToggle(node)}
                style={{ paddingLeft: `${paddingLeft}px` }}
                className={cn(
                    "flex items-center py-1 pr-2 cursor-pointer transition-colors group select-none",
                    node.isOpen ? "bg-[#2a2a2a] text-white" : "text-[#888] hover:bg-[#222] hover:text-[#ccc]"
                )}
            >
                <div className="w-4 h-4 flex items-center justify-center mr-0.5">
                    {node.children && (
                        node.isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                    )}
                </div>
                {node.isOpen ? (
                    <FolderOpen className="w-3.5 h-3.5 mr-2 text-[#00deea]" />
                ) : (
                    <Folder className="w-3.5 h-3.5 mr-2 text-[#666] group-hover:text-[#888]" />
                )}
                <span className="text-[11px] font-medium truncate">{node.name}</span>
            </div>
            {node.isOpen && node.children && (
                <div className="flex flex-col">
                    {node.children.map((child: any, i: number) => (
                        <FolderTreeItem key={`${child.name}-${i}`} node={child} depth={depth + 1} onToggle={onToggle} />
                    ))}
                </div>
            )}
        </>
    );
};
