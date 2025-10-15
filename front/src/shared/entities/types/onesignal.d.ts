export interface OneSignalPushSubscription {
  id?: string;
  addEventListener(
    event: "change",
    callback: (event: { current?: { id?: string } }) => void
  ): void;
}

export interface OneSignalUser {
  PushSubscription: OneSignalPushSubscription;
}

export interface OneSignalNotifications {
  requestPermission(): Promise<NotificationPermission>;
  addEventListener(
    event:
      | "click"
      | "foregroundWillDisplay"
      | "permissionChange"
      | "dismiss"
      | "dismissclick",
    callback: (event: unknown) => void
  ): void;
}

export interface OneSignal {
  init(options: {
    appId: string;
    safari_web_id?: string;
    notifyButton?: { enable: boolean };
    serviceWorkerParam?: { scope: string };
    serviceWorkerPath?: string;
    allowLocalhostAsSecureOrigin?: boolean;
  }): Promise<void>;

  isInitialized(): boolean;

  Slidedown: {
    promptPush(options?: object): Promise<void>;
  };

  on(event: string, listener: (isSubscribed: boolean) => void): void;
  getUserId(): Promise<string | null>;

  // OneSignal v16 additions:
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
