// Custom type declarations for lodash
declare module 'lodash' {
  export interface DebouncedFunc<T extends (...args: any[]) => any> {
    (...args: Parameters<T>): ReturnType<T> | undefined;
    cancel(): void;
    flush(): ReturnType<T> | undefined;
  }

  export interface DebouncedFuncLeading<T extends (...args: any[]) => any> extends DebouncedFunc<T> {
    (...args: Parameters<T>): ReturnType<T> | undefined;
  }

  export interface DebounceSettings {
    leading?: boolean;
    maxWait?: number;
    trailing?: boolean;
  }

  export interface ThrottleSettings {
    leading?: boolean;
    trailing?: boolean;
  }

  export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: DebounceSettings
  ): DebouncedFunc<T>;

  export function throttle<T extends (...args: any[]) => any>(
    func: T,
    wait?: number,
    options?: ThrottleSettings
  ): DebouncedFunc<T>;
}