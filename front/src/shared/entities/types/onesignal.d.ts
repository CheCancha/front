// --- TIPOS PARA LA API V16 ---

export interface PushSubscriptionState {
  id: string | null | undefined;
  token?: string | null;
  optedIn?: boolean;
}

export interface PushSubscriptionChangeEvent {
  previous?: PushSubscriptionState;
  current?: PushSubscriptionState;
}

  // Forzar opt-in / opt-out manualmente
export interface OneSignalPushSubscription extends PushSubscriptionState {
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
