import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Music, Play, Pause, BarChart3 } from "lucide-react";
import { AudioFile } from "@/types/audio";
import { AudioComparison } from "@/components/AudioComparison";

interface EnhancedSongsListProps {
  enhancedFiles: AudioFile[];
  onDownload: (file: AudioFile) => void;
  onDelete: (fileId: string) => void;
}

export const EnhancedSongsList = ({
  enhancedFiles,
  onDownload,
  onDelete,
}: EnhancedSongsListProps) => {
  const [compareFile, setCompareFile] = useState<AudioFile | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getCompressionRatio = (original: number, enhanced: number) => {
    if (original === 0) return "0%";
    const ratio = ((enhanced - original) / original) * 100;
    return ratio > 0 ? `+${ratio.toFixed(1)}%` : `${ratio.toFixed(1)}%`;
  };

  // Keep track of last 20 enhanced files
  const displayFiles = enhancedFiles.slice(-20);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-3">
            <Music className="h-5 w-5 text-green-400" />
            Enhanced Songs ({displayFiles.length})
            <span className="text-sm text-slate-400 font-normal">
              - Last 20 Enhanced
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {displayFiles.length > 0 ? (
            <div className="space-y-3">
              {displayFiles.map((file) => (
                <div key={file.id} className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <Music className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate font-medium">
                        {file.name}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                        <span>Original: {formatFileSize(file.size)}</span>
                        {file.enhancedSize && (
                          <>
                            <span>
                              Enhanced: {formatFileSize(file.enhancedSize)}
                            </span>
                            <span
                              className={
                                getCompressionRatio(
                                  file.size,
                                  file.enhancedSize,
                                ).startsWith("+")
                                  ? "text-blue-400"
                                  : "text-green-400"
                              }
                            >
                              {getCompressionRatio(
                                file.size,
                                file.enhancedSize,
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCompareFile(
                            compareFile?.id === file.id ? null : file,
                          )
                        }
                        className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white h-8 px-3"
                        title="A/B Compare"
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(file)}
                        className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white h-8 px-3"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(file.id)}
                        className="bg-red-900/50 border-red-600 hover:bg-red-800 text-red-200 h-8 px-3"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* A/B Comparison Component */}
                  {compareFile?.id === file.id && (
                    <AudioComparison
                      originalUrl={
                        file.originalFile
                          ? URL.createObjectURL(file.originalFile)
                          : undefined
                      }
                      enhancedUrl={file.enhancedUrl}
                      filename={file.name}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No enhanced songs yet</p>
              <p className="text-slate-500 text-sm">
                Process songs in the Enhance tab to see them here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {enhancedFiles.length > 20 && (
        <div className="text-center text-xs text-slate-400 p-2 bg-slate-800/50 rounded">
          Showing last 20 of {enhancedFiles.length} enhanced files.
          <span className="text-blue-400 ml-1">
            Buy Pro version for unlimited history!
          </span>
        </div>
      )}
    </div>
  );
};
