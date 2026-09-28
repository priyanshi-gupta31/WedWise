import { useState, useEffect, useMemo } from 'react';
import { memoryService } from '../services/memoryService';
import { MemoryMedia } from '../types/memories';

/**
 * Hook to resolve a private Supabase storage path into a secure signed URL.
 * Automatically handles http, https, blob:, and data: URLs synchronously without delay.
 */
export function useSignedMediaUrl(storagePath?: string | null): {
  url: string | null;
  isLoading: boolean;
} {
  const isDirectUrl = useMemo(() => {
    if (!storagePath) return false;
    return (
      storagePath.startsWith('http://') ||
      storagePath.startsWith('https://') ||
      storagePath.startsWith('blob:') ||
      storagePath.startsWith('data:')
    );
  }, [storagePath]);

  const [url, setUrl] = useState<string | null>(isDirectUrl ? storagePath || null : null);
  const [isLoading, setIsLoading] = useState<boolean>(!isDirectUrl && Boolean(storagePath));

  useEffect(() => {
    if (!storagePath) {
      setUrl(null);
      setIsLoading(false);
      return;
    }

    if (isDirectUrl) {
      setUrl(storagePath);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    memoryService
      .getSignedMediaUrl(storagePath)
      .then((signed) => {
        if (isMounted) {
          setUrl(signed);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to resolve signed URL:', err);
        if (isMounted) {
          setUrl(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [storagePath, isDirectUrl]);

  return { url, isLoading };
}

/**
 * Batch hook to resolve multiple media items' full and thumbnail URLs.
 */
export function useMemoryMediaSignedUrls(mediaList?: MemoryMedia[]): {
  urlsMap: Record<string, { full: string | null; thumb: string | null }>;
  isLoading: boolean;
} {
  const [urlsMap, setUrlsMap] = useState<
    Record<string, { full: string | null; thumb: string | null }>
  >({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!mediaList || mediaList.length === 0) {
      setUrlsMap({});
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const pathsToFetch: string[] = [];
    const directMap: Record<string, { full: string | null; thumb: string | null }> = {};

    mediaList.forEach((item) => {
      const full = item.storage_path;
      const thumb = item.thumbnail_path || item.storage_path;

      const isFullDirect =
        full.startsWith('http') || full.startsWith('blob:') || full.startsWith('data:');
      const isThumbDirect =
        thumb.startsWith('http') || thumb.startsWith('blob:') || thumb.startsWith('data:');

      directMap[item.id] = {
        full: isFullDirect ? full : null,
        thumb: isThumbDirect ? thumb : null,
      };

      if (!isFullDirect && full) pathsToFetch.push(full);
      if (!isThumbDirect && thumb && thumb !== full) pathsToFetch.push(thumb);
    });

    if (pathsToFetch.length === 0) {
      setUrlsMap(directMap);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    memoryService
      .getSignedMediaUrls(pathsToFetch)
      .then((signedRecord) => {
        if (!isMounted) return;

        const completeMap: Record<string, { full: string | null; thumb: string | null }> = {};

        mediaList.forEach((item) => {
          const full = item.storage_path;
          const thumb = item.thumbnail_path || item.storage_path;

          completeMap[item.id] = {
            full: directMap[item.id].full || signedRecord[full] || null,
            thumb: directMap[item.id].thumb || signedRecord[thumb] || signedRecord[full] || null,
          };
        });

        setUrlsMap(completeMap);
        setIsLoading(false);
      })
      .catch((err) => {
        console.warn('Batch signed URL resolution error:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mediaList]);

  return { urlsMap, isLoading };
}
