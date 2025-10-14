// types/onesignal.d.ts

export interface OneSignal {
  init(options: object): Promise<void>;
  isInitialized(): boolean;
  Slidedown: {
    promptPush(options?: object): Promise<void>;
  };
  on(event: string, listener: (isSubscribed: boolean) => void): void;
  getUserId(): Promise<string | null>;
}

declare global {
  interface Window {
    OneSignalDeferred: Array<(OneSignal: OneSignal) => void>;
  }
}