
import { Card, CardContent } from '@/components/ui/card';
import { FileAudio, Upload, Settings, Download } from 'lucide-react';
import { AudioStats } from '@/types/audio';

interface StatsCardsProps {
  stats: AudioStats;
}

export const StatsCards = ({ stats }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <FileAudio className="h-8 w-8 text-blue-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-slate-400 text-sm">Total Files</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Upload className="h-8 w-8 text-green-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.uploaded}</p>
              <p className="text-slate-400 text-sm">Ready to Process</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-yellow-400 animate-spin" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.processing}</p>
              <p className="text-slate-400 text-sm">Processing</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Download className="h-8 w-8 text-purple-400" />
            <div>
              <p className="text-2xl font-bold text-white">{stats.enhanced}</p>
              <p className="text-slate-400 text-sm">Enhanced</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
