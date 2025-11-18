import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useMasteringHistory, MasteringHistoryEntry } from '@/hooks/useMasteringHistory';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

export const MasteringHistory = () => {
  const { history, clearHistory, removeEntry } = useMasteringHistory();
  const { t } = useLanguage();
  const { toast } = useToast();

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const handleDownload = async (entry: MasteringHistoryEntry) => {
    if (!entry.masteredUrl) return;
    
    try {
      const response = await fetch(entry.masteredUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mastered_${entry.targetFileName}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Downloaded',
        description: 'Mastered file downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Could not download the file',
        variant: 'destructive',
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      cancelled: 'secondary',
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status}
      </Badge>
    );
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-foreground">Mastering History</CardTitle>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            className="text-destructive hover:text-destructive"
          >
            Clear All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No mastering history yet. Start by mastering your first track!
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {history.map((entry) => (
                <Card key={entry.id} className="bg-background/50 border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(entry.status)}
                          <p className="font-medium text-foreground truncate">
                            {entry.targetFileName}
                          </p>
                          {getStatusBadge(entry.status)}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p className="truncate">
                            Reference: {entry.referenceFileName}
                          </p>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(entry.timestamp)}
                            </span>
                            {entry.processingTime && (
                              <span>
                                Duration: {formatDuration(entry.processingTime)}
                              </span>
                            )}
                          </div>
                          {entry.errorMessage && (
                            <p className="text-destructive text-xs mt-1">
                              {entry.errorMessage}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.status === 'success' && entry.masteredUrl && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(entry)}
                            className="h-8 w-8 p-0"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeEntry(entry.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
