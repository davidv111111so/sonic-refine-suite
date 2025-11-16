import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Package, AlertTriangle } from "lucide-react";
import { AudioFile } from "@/types/audio";
import { NewTrackManagementRow } from "@/components/NewTrackManagementRow";
import { TrackListFilters } from "@/components/TrackListFilters";

interface EnhancedTrackManagementProps {
  audioFiles: AudioFile[];
  enhancedHistory: AudioFile[];
  onDownload: (file: AudioFile) => void;
  onConvert: (file: AudioFile, targetFormat: "mp3" | "wav" | "flac") => void;
  onDownloadAll: () => void;
  onClearDownloaded?: () => void;
  onClearAll?: () => void;
  onFileInfo?: (file: AudioFile) => void;
  processingSettings?: {
    outputFormat?: string;
  };
}

export const EnhancedTrackManagement = ({
  audioFiles,
  enhancedHistory,
  onDownload,
  onConvert,
  onDownloadAll,
  onClearDownloaded,
  onClearAll,
  onFileInfo,
  processingSettings,
}: EnhancedTrackManagementProps) => {
  const [sortBy, setSortBy] = useState("name-asc");
  const [removedFileIds, setRemovedFileIds] = useState<Set<string>>(new Set());

  const allFiles = useMemo(() => {
    return [...audioFiles, ...enhancedHistory].filter(
      (file) => !removedFileIds.has(file.id),
    );
  }, [audioFiles, enhancedHistory, removedFileIds]);

  const sortedFiles = useMemo(() => {
    const filesCopy = [...allFiles];

    switch (sortBy) {
      case "name-asc":
        return filesCopy.sort((a, b) => a.name.localeCompare(b.name));
      case "name-desc":
        return filesCopy.sort((a, b) => b.name.localeCompare(a.name));
      case "key":
        return filesCopy.sort((a, b) => {
          const keyA = a.harmonicKey || "ZZZ";
          const keyB = b.harmonicKey || "ZZZ";
          return keyA.localeCompare(keyB);
        });
      case "size-asc":
        return filesCopy.sort((a, b) => a.size - b.size);
      case "size-desc":
        return filesCopy.sort((a, b) => b.size - a.size);
      default:
        return filesCopy;
    }
  }, [allFiles, sortBy]);

  const handleRemove = (fileId: string) => {
    setRemovedFileIds((prev) => new Set(prev).add(fileId));
  };

  const hasEnhancedFiles = enhancedHistory.some(
    (file) => file.status === "enhanced" && !removedFileIds.has(file.id),
  );

  if (sortedFiles.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600">
        <CardContent className="py-8">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-blue-400 opacity-50" />
            <p className="text-lg mb-2 font-semibold text-cyan-400">
              No tracks uploaded yet
            </p>
            <p className="text-sm text-slate-300">
              Upload audio files to see them listed here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-900/90 dark:bg-black/90 border-slate-700 dark:border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <BarChart3 className="h-5 w-5" />
            Track List ({sortedFiles.length} files)
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasEnhancedFiles && (
              <p className="text-sm text-slate-400">
                All enhanced files available
              </p>
            )}
            {sortedFiles.length > 0 && onClearAll && (
              <Button
                onClick={onClearAll}
                variant="outline"
                size="sm"
                className="bg-red-600/20 border-red-500 hover:bg-red-600/30 text-red-300 hover:text-red-200 h-8"
              >
                <AlertTriangle className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <TrackListFilters sortBy={sortBy} onSortChange={setSortBy} />

        <div className="space-y-3">
          {/* Header Row */}
          <div className="grid grid-cols-7 gap-4 p-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 rounded-lg text-sm font-medium border border-slate-600">
            <div className="col-span-2 bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-bold">
              Song Name
            </div>
            <div className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-bold">
              Key
            </div>
            <div className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-bold">
              File Size
            </div>
            <div className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-bold">
              Status
            </div>
            <div className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-bold">
              Conversion
            </div>
            <div className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-bold">
              Actions
            </div>
          </div>

          {/* Track Rows */}
          {sortedFiles.map((file) => (
            <NewTrackManagementRow
              key={file.id}
              file={file}
              onDownload={onDownload}
              onConvert={onConvert}
              onRemove={handleRemove}
              onFileInfo={onFileInfo}
              processingSettings={processingSettings}
            />
          ))}
        </div>

        {/* Action Buttons */}
        {sortedFiles.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-600 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-3">
                {/* Download All Button */}
                {enhancedHistory.filter(
                  (f) => f.status === "enhanced" && !removedFileIds.has(f.id),
                ).length >= 2 && (
                  <Button
                    onClick={onDownloadAll}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium shadow-lg"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Download All (
                    {
                      enhancedHistory.filter(
                        (f) =>
                          f.status === "enhanced" && !removedFileIds.has(f.id),
                      ).length
                    }
                    )
                  </Button>
                )}

                {/* Clear Button */}
                {enhancedHistory.filter((f) => !removedFileIds.has(f.id))
                  .length > 0 &&
                  onClearDownloaded && (
                    <Button
                      onClick={onClearDownloaded}
                      variant="outline"
                      className="bg-red-600/20 border-red-500 hover:bg-red-600/30 text-red-300 hover:text-red-200"
                    >
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Clear Downloaded (
                      {
                        enhancedHistory.filter((f) => !removedFileIds.has(f.id))
                          .length
                      }
                      )
                    </Button>
                  )}
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="rounded-lg p-3 border border-slate-600/50 bg-slate-600">
                <div className="text-sm bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-bold">
                  Total Files
                </div>
                <div className="text-xl font-bold text-white">
                  {sortedFiles.length}
                </div>
              </div>
              <div className="bg-blue-700/30 rounded-lg p-3 border border-blue-600/50">
                <div className="text-sm bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-bold">
                  In Queue
                </div>
                <div className="text-xl font-bold text-blue-300">
                  {sortedFiles.filter((f) => f.status === "uploaded").length}
                </div>
              </div>
              <div className="bg-orange-700/30 rounded-lg p-3 border border-orange-600/50">
                <div className="text-sm bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-bold">
                  Processing
                </div>
                <div className="text-xl font-bold text-orange-300">
                  {sortedFiles.filter((f) => f.status === "processing").length}
                </div>
              </div>
              <div className="bg-green-700/30 rounded-lg p-3 border border-green-600/50">
                <div className="text-sm bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-bold">
                  Complete
                </div>
                <div className="text-xl font-bold text-green-300">
                  {sortedFiles.filter((f) => f.status === "enhanced").length}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
