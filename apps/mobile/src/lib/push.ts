import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { notificationsApi, type DevicePlatform } from './api/notifications';

let cachedToken: string | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function ensurePermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

async function setupAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#2563eb',
  });
}

export async function getDevicePushToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;

  const ok = await ensurePermissions();
  if (!ok) return null;

  await setupAndroidChannel();

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ||
      (Constants as unknown as { easConfig?: { projectId?: string } }).easConfig?.projectId;

    if (!projectId || projectId === 'REPLACE_AFTER_EAS_INIT') {
      // eslint-disable-next-line no-console
      console.warn('[push] EAS projectId not set — skipping token fetch');
      return null;
    }

    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    cachedToken = result.data;
    return cachedToken;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[push] failed to fetch token', err);
    return null;
  }
}

export async function registerDeviceForPush(): Promise<string | null> {
  const token = await getDevicePushToken();
  if (!token) return null;

  const platform: DevicePlatform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
  const appVersion = Constants.expoConfig?.version;

  try {
    await notificationsApi.registerDeviceToken(token, platform, appVersion);
    return token;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[push] register failed', err);
    return null;
  }
}

export async function unregisterDeviceForPush(): Promise<void> {
  if (!cachedToken) return;
  try {
    await notificationsApi.unregisterDeviceToken(cachedToken);
  } catch {
    /* best-effort: server side cleans up on TTL anyway */
  } finally {
    cachedToken = null;
  }
}

export function addNotificationResponseListener(
  handler: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(handler);
}

export function addNotificationReceivedListener(
  handler: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(handler);
}
