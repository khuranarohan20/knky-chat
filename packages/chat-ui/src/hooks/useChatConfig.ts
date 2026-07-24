import { useAdapter } from '../adapter/AdapterContext';
import type { ChatHostServices } from '../adapter/types';

/**
 * Access the host-provided integration services (asset URLs, modals,
 * permissions, toasts). Ported components call these instead of the host app's
 * own utilities, so they behave identically without a hard dependency on the app.
 */
export function useChatConfig(): ChatHostServices {
  return useAdapter().getServices();
}
