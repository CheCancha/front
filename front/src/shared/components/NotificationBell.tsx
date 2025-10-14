"use client";

import { useState } from 'react';
import useSWR from 'swr';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface NotificationBellProps {
  isTransparent: boolean;
}

export function NotificationBell({ isTransparent }: NotificationBellProps) {
  const { data: notifications, mutate } = useSWR<Notification[]>('/api/notifications', fetcher);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications?.filter((n) => !n.isRead).length || 0;

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    // Si se abre el popover y hay notificaciones sin leer, las marcamos como leídas
    if (open && unreadCount > 0) {
      // Optimistic UI: Actualizamos la UI localmente al instante
      const newNotifications = notifications!.map(n => ({ ...n, isRead: true }));
      mutate(newNotifications, false);

      await fetch('/api/notifications/mark-as-read', { method: 'POST' });
      
      mutate();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "relative p-2 rounded-md focus:outline-none transition-colors cursor-pointer",
            isTransparent
              ? "text-white hover:bg-white/10" 
              : "text-brand-dark hover:bg-gray-100"
          )}
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div>
          <h3 className="text-lg font-medium">Notificaciones</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications && notifications.length > 0 ? (
            notifications.map((notif) => (
              <div key={notif.id} className="p-4 border-b hover:bg-gray-50">
                <p className="font-semibold">{notif.title}</p>
                <p className="text-sm text-gray-600">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: es })}
                </p>
              </div>
            ))
          ) : (
            <p className="p-4 text-center text-gray-500">No tienes notificaciones.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}