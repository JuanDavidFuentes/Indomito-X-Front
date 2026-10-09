'use client';

import type { CreateWishlistInput, WishlistDetail, WishlistsResponse, WishlistSummary } from '@juandavidfuentes/indomitox-shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from './api/client';
import { useSession } from './session';

export const WISHLISTS_KEY = ['wishlists'] as const;
export const wishlistKey = (id: string) => ['wishlist', id] as const;

/** Listas de favoritos del usuario de la sesión (EXP-01). Sin sesión no pide nada. */
export function useWishlists() {
  const { data: user } = useSession();
  return useQuery({
    queryKey: WISHLISTS_KEY,
    queryFn: () => api<WishlistsResponse>('/v1/me/wishlists'),
    enabled: Boolean(user),
    staleTime: 30_000,
  });
}

/** Ids guardados en alguna lista (corazones llenos). */
export function useSavedIds(): Set<string> {
  const { data } = useWishlists();
  return useMemo(() => new Set(data?.savedListingIds ?? []), [data]);
}

export function useWishlist(id: string) {
  return useQuery({ queryKey: wishlistKey(id), queryFn: () => api<WishlistDetail>(`/v1/me/wishlists/${id}`), staleTime: 15_000 });
}

/** Mutaciones de favoritos: todas refrescan las listas y los corazones. */
export function useWishlistActions() {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ predicate: (query) => ['wishlists', 'wishlist'].includes(String(query.queryKey[0])) });
  const options = { onSettled: refresh };
  return {
    create: useMutation({ mutationFn: (input: CreateWishlistInput) => api<WishlistSummary>('/v1/me/wishlists', { method: 'POST', body: input }), ...options }),
    add: useMutation({
      mutationFn: ({ listId, listingId }: { listId: string; listingId: string }) => api(`/v1/me/wishlists/${listId}/items/${listingId}`, { method: 'PUT' }),
      ...options,
    }),
    remove: useMutation({
      mutationFn: ({ listId, listingId }: { listId: string; listingId: string }) => api(`/v1/me/wishlists/${listId}/items/${listingId}`, { method: 'DELETE' }),
      ...options,
    }),
    unsave: useMutation({ mutationFn: (listingId: string) => api(`/v1/me/saved/${listingId}`, { method: 'DELETE' }), ...options }),
    rename: useMutation({
      mutationFn: ({ id, name }: { id: string; name: string }) => api<WishlistSummary>(`/v1/me/wishlists/${id}`, { method: 'PATCH', body: { name } }),
      ...options,
    }),
    destroy: useMutation({ mutationFn: (id: string) => api(`/v1/me/wishlists/${id}`, { method: 'DELETE' }), ...options }),
  };
}
