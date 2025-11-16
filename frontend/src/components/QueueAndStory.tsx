import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, List, Music } from "lucide-react";
import { AudioFile } from "@/types/audio";

interface QueueAndStoryProps {
  audioFiles: AudioFile[];
}

export const QueueAndStory = ({ audioFiles }: QueueAndStoryProps) => {
  const queueFiles = audioFiles.filter((f) => f.status === "uploaded");
  const processingFiles = audioFiles.filter((f) => f.status === "processing");

  return (
    <div className="space-y-6">
      {/* Processing Queue */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-400" />
            Processing Queue
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {processingFiles.length > 0 ? (
            <div className="space-y-3">
              {processingFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{file.name}</p>
                    <div className="text-sm text-slate-400 mt-1">
                      {file.processingStage || "Processing..."}
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">
              No files currently processing
            </p>
          )}
        </CardContent>
      </Card>

      {/* Queue */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-3">
            <List className="h-5 w-5 text-blue-400" />
            Queue ({queueFiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {queueFiles.length > 0 ? (
            <div className="space-y-2">
              {queueFiles.map((file, index) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-2 bg-slate-800/30 rounded"
                >
                  <span className="text-slate-400 text-sm w-6">
                    {index + 1}.
                  </span>
                  <Music className="h-4 w-4 text-blue-400" />
                  <span className="text-white text-sm flex-1 truncate">
                    {file.name}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {(file.size / (1024 * 1024)).toFixed(1)}MB
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-center py-4">No files in queue</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
