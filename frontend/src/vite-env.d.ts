/// <reference types="vite/client" />

interface SneatMenuInstance {
  toggle: (el: Element) => void;
  update?: () => void;
}

interface Window {
  FWM_API_SCHEME?: string;
  FWM_API_HOST?: string;
  FWM_API_PORT?: string;
  currentLang?: string;
  currentPlatform?: string;
  currentProtocol?: string;
  i18n?: unknown;
  langOrder?: unknown;
  langNames?: unknown;
  kyklosCurrentUser?: {
    username: string;
    display_name?: string | null;
    role_codes?: string[];
    source?: string;
  };
  Helpers?: {
    mainMenu?: SneatMenuInstance;
    scrollToActive: (animate: boolean) => void;
    toggleCollapsed: () => void;
    isMobileDevice?: () => boolean;
    isSmallScreen: () => boolean;
    setAutoUpdate: (enabled: boolean) => void;
  };
  Menu?: new (el: Element, opts: { orientation: string; closeChildren: boolean }) => SneatMenuInstance;
  PerfectScrollbar?: new (el: Element) => unknown;
  bootstrap?: {
    Tooltip: new (el: Element) => unknown;
    Modal: {
      getOrCreateInstance: (el: Element) => { show: () => void; hide: () => void; };
    };
  };
  setLanguage?: (lang: string, persist?: boolean) => void;
  loadIptables?: () => void;
  fwmSwitchView?: (mode: string) => void;
  fwmSetSecuritySubView?: (subview: string) => void;
  kyklosDefaultView?: string;
  kyklosForceDefaultTab?: boolean;
}

declare module 'reportbro-designer' {
  export class ReportBro {
    constructor(element: HTMLElement, properties?: Record<string, unknown>);
    getReport(): Record<string, unknown>;
    load(report: Record<string, unknown>): void;
    save(): void;
    destroy?: () => void;
  }
}
