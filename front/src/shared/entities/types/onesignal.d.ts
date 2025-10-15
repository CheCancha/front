// --- TIPOS PARA LA API V16 ---

export interface PushSubscriptionChangeEvent {
  current: {
    id: string | null;
  };
}

export interface OneSignalPushSubscription {
  addEventListener(event: 'change', listener: (event: PushSubscriptionChangeEvent) => void): void;
}

export interface OneSignalUser {
  PushSubscription: OneSignalPushSubscription;
}

export interface OneSignalPushSubscription {
  id: string | null; 
  addEventListener(event: 'change', listener: (event: PushSubscriptionChangeEvent) => void): void;
}

// --- INTERFAZ PRINCIPAL DEL SDK ---

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