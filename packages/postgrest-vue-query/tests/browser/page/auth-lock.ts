import { NavigatorLockAcquireTimeoutError } from '@supabase/supabase-js';

export async function authLock<R>(
  name: string,
  acquireTimeout: number,
  operation: () => Promise<R>,
): Promise<R> {
  const controller = new AbortController();
  const timer =
    acquireTimeout > 0
      ? setTimeout(() => controller.abort(), acquireTimeout)
      : undefined;
  try {
    const result = await navigator.locks.request(
      name,
      acquireTimeout === 0
        ? { mode: 'exclusive', ifAvailable: true }
        : { mode: 'exclusive', signal: controller.signal },
      async (lock): Promise<{ value: R } | { error: unknown }> => {
        clearTimeout(timer);
        if (!lock) return { error: new NavigatorLockAcquireTimeoutError(name) };
        // Firefox reports rejected native lock callbacks even when the caller catches them.
        try {
          return { value: await operation() };
        } catch (error) {
          return { error };
        }
      },
    );
    if ('error' in result) throw result.error;
    return result.value;
  } catch (error) {
    if (
      controller.signal.aborted &&
      error instanceof DOMException &&
      error.name === 'AbortError'
    )
      throw new NavigatorLockAcquireTimeoutError(name);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
