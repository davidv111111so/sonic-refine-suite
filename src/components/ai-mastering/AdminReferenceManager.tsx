/**
 * Admin Reference Manager
 * Admin-only component for managing genre reference WAV files for AI Mastering
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, Trash2, Music, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const GENRES = [
  'Techno',
  'House',
  'Trance',
  'Drum & Bass',
  'Dubstep',
  'Progressive House',
  'Deep House',
  'Tech House',
  'Hip Hop',
  'Rock',
  'Pop',
  'Electronic'
];

interface ReferenceTrack {
  genre: string;
  filename: string;
  size: number;
  uploadedAt: number;
}

export const AdminReferenceManager: React.FC = () => {
  const { isAdmin, loading } = useUserSubscription();
  const [references, setReferences] = useState<Map<string, ReferenceTrack>>(new Map());
  const [uploading, setUploading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load references from IndexedDB on mount
  useEffect(() => {
    loadReferences();
  }, []);

  const loadReferences = async () => {
    try {
      const db = await openDB();
      const tx = db.transaction('references', 'readonly');
      const store = tx.objectStore('references');
      
      const getAllKeysRequest = store.getAllKeys();
      const allKeys = await new Promise<IDBValidKey[]>((resolve, reject) => {
        getAllKeysRequest.onsuccess = () => resolve(getAllKeysRequest.result);
        getAllKeysRequest.onerror = () => reject(getAllKeysRequest.error);
      });
      
      const refsMap = new Map<string, ReferenceTrack>();
      for (const key of allKeys) {
        const getRequest = store.get(key);
        const data = await new Promise<any>((resolve, reject) => {
          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => reject(getRequest.error);
        });
        
        if (data) {
          refsMap.set(key as string, {
            genre: data.genre,
            filename: data.filename,
            size: data.size,
            uploadedAt: data.uploadedAt,
          });
        }
      }
      
      setReferences(refsMap);
    } catch (error) {
      console.error('Failed to load references:', error);
    }
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('spectrum-references', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('references')) {
          db.createObjectStore('references');
        }
      };
    });
  };

  const handleUpload = async (genre: string, file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Invalid file', {
        description: 'Please upload an audio file (WAV recommended)',
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Maximum file size is 100MB',
      });
      return;
    }

    setUploading(genre);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const db = await openDB();
      const tx = db.transaction('references', 'readwrite');
      const store = tx.objectStore('references');
      
      const trackData = {
        genre,
        data: arrayBuffer,
        filename: file.name,
        size: file.size,
        uploadedAt: Date.now(),
      };
      
      const putRequest = store.put(trackData, genre);
      await new Promise((resolve, reject) => {
        putRequest.onsuccess = () => resolve(undefined);
        putRequest.onerror = () => reject(putRequest.error);
      });
      
      await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(undefined);
        tx.onerror = () => reject(tx.error);
      });
      
      await loadReferences();
      
      toast.success('Reference uploaded', {
        description: `${genre} reference track saved successfully`,
      });
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed', {
        description: 'Failed to save reference track',
      });
    } finally {
      setUploading(null);
    }
  };

  const handleDelete = async (genre: string) => {
    try {
      const db = await openDB();
      const tx = db.transaction('references', 'readwrite');
      const store = tx.objectStore('references');
      
      const deleteRequest = store.delete(genre);
      await new Promise((resolve, reject) => {
        deleteRequest.onsuccess = () => resolve(undefined);
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
      
      await new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(undefined);
        tx.onerror = () => reject(tx.error);
      });
      
      await loadReferences();
      
      toast.success('Reference deleted', {
        description: `${genre} reference track removed`,
      });
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Delete failed', {
        description: 'Failed to remove reference track',
      });
    } finally {
      setDeleteConfirm(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-900 border-slate-700">
        <CardContent className="py-12 text-center">
          <p className="text-slate-400">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 border-purple-500/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Shield className="h-5 w-5 text-purple-400" />
            Admin: Reference Track Management
          </CardTitle>
          <Badge variant="outline" className="bg-purple-500/20 text-purple-300 border-purple-400">
            Admin Only
          </Badge>
        </div>
        <p className="text-sm text-slate-400 mt-2">
          Upload and manage genre reference tracks for AI Mastering. These will be available to all users.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {GENRES.map((genre) => {
            const ref = references.get(genre);
            const isUploading = uploading === genre;
            
            return (
              <Card key={genre} className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        <Music className="h-4 w-4 text-cyan-400" />
                        {genre}
                      </h3>
                      {ref && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteConfirm(genre)}
                          className="h-7 w-7 p-0 hover:bg-red-500/20 hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {ref ? (
                      <div className="flex items-start gap-2 p-2 bg-green-500/10 rounded border border-green-500/30">
                        <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{ref.filename}</p>
                          <p className="text-xs text-slate-400">
                            {(ref.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(ref.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 border-2 border-dashed border-slate-600 rounded text-center">
                        <AlertCircle className="h-5 w-5 text-slate-500" />
                        <p className="text-sm text-slate-500">No reference uploaded</p>
                      </div>
                    )}

                    <label>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        disabled={isUploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(genre, file);
                          e.target.value = '';
                        }}
                      />
                      <Button
                        variant="outline"
                        className="w-full bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                        disabled={isUploading}
                        asChild
                      >
                        <span>
                          {isUploading ? (
                            <>
                              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              {ref ? 'Replace' : 'Upload'} Reference
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
          <AlertDialogContent className="bg-slate-900 border-slate-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Delete Reference Track?</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Are you sure you want to delete the {deleteConfirm} reference track? This action cannot be undone and will affect all users.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};
