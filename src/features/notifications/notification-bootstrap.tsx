import { useNotificationListeners } from "./use-notification-listeners";
import { useNotificationSetup } from "./use-notification-setup";

/** Side-effect hooks mounted once in the app tab shell. */
export function NotificationBootstrap() {
  useNotificationSetup();
  useNotificationListeners();
  return null;
}
