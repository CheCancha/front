"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSearchStore } from '@/app/features/public/store/searchStore';

export function SearchStateInitializer() {
  const searchParams = useSearchParams();
  const initializeFromUrl = useSearchStore((state) => state.initializeFromUrl);

  useEffect(() => {
    initializeFromUrl(searchParams);
  }, [searchParams, initializeFromUrl]);

  return null;
}
