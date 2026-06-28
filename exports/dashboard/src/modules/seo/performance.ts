export type ImageSurface = 'hero' | 'feature' | 'card' | 'thumbnail';

export function getImagePerformanceProps(surface: ImageSurface) {
  if (surface === 'hero') {
    return {
      loading: 'eager' as const,
      decoding: 'sync' as const,
      fetchPriority: 'high' as const,
      sizes: '100vw',
    };
  }

  if (surface === 'feature') {
    return {
      loading: 'lazy' as const,
      decoding: 'async' as const,
      fetchPriority: 'auto' as const,
      sizes: '(max-width: 1024px) 100vw, 40vw',
    };
  }

  if (surface === 'thumbnail') {
    return {
      loading: 'lazy' as const,
      decoding: 'async' as const,
      fetchPriority: 'low' as const,
      sizes: '88px',
    };
  }

  return {
    loading: 'lazy' as const,
    decoding: 'async' as const,
    fetchPriority: 'auto' as const,
    sizes: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  };
}
