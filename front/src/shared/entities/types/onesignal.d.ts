// --- TIPOS PARA LA API V16 ---

export interface PushSubscriptionState {
  id: string | null | undefined;
  token?: string | null;
  optedIn?: boolean;
}

export interface PushSubscriptionChangeEvent {
  current: {
    id: string | null;
    optedIn?: boolean;
  };
}

  // Forzar opt-in / opt-out manualmente
export interface OneSignalPushSubscription {
  id: string | null;
  optedIn?: boolean;

  // Forzar opt-in / opt-out manualmente
  optIn(): Promise<void>;
  optOut(): Promise<void>;

  // Escuchar cambios en la suscripción
  addEventListener(
    event: "change",
    listener: (event: PushSubscriptionChangeEvent) => void
  ): void;
}

export interface OneSignalUser {
  PushSubscription: OneSignalPushSubscription;
}

export interface OneSignalNotifications {
  permission: Promise<"default" | "granted" | "denied">;
  requestPermission(): Promise<"granted" | "denied">;
  addEventListener(
    event: "permissionChange",
    listener: (wasGranted: boolean) => void
  ): void;
  addEventListener(
    event: "notificationDisplay",
    listener: (event: NotificationDisplayEvent) => void
  ): void;
}

export interface NotificationData {
  url?: string | null;
  [key: string]: unknown;
}

export interface NotificationDisplayEvent {
  notification: {
    title?: string | null;
    body?: string | null;
    icon?: string | null;
    data?: NotificationData | null;
  };
}

export interface OneSignal {
  init(options: {
    appId: string;
    allowLocalhostAsSecureOrigin?: boolean;
  }): Promise<void>;

  Slidedown: {
    promptPush(options?: object): Promise<void>;
  };

  User: OneSignalUser;
  Notifications: OneSignalNotifications;
}

declare global {
  interface Window {
    OneSignal?: OneSignal;
    OneSignalDeferred?: Array<(OneSignal: OneSignal) => void>;
    oneSignalInitialized?: boolean;
  }
}

export {};
