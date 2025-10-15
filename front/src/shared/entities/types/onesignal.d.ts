// in types/onesignal.d.ts (or your chosen path)

// 1. Define an interface for the OneSignal object itself.
// We only need to define the parts of the SDK we actually use.
export interface OneSignal {
  init(options: object): Promise<void>;
  isInitialized(): boolean;
  Slidedown: {
    promptPush(options?: object): Promise<void>;
  };
  on(event: string, listener: (isSubscribed: boolean) => void): void;
  getUserId(): Promise<string | null>;
}

// 2. Use "declaration merging" to add properties to the global Window interface.
declare global {
  interface Window {
    // We make it optional with '?' because it might not exist immediately on page load.
    OneSignal?: OneSignal; 
    
    // Also declare OneSignalDeferred, which you use in your layout.
    OneSignalDeferred?: Array<(OneSignal: OneSignal) => void>;
  }
}