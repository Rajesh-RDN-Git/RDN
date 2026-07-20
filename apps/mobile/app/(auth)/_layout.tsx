import { Stack } from 'expo-router';

// Login and Register render their own titles ("Welcome Back" / "Create Account"),
// so suppress the default navigator header (which otherwise showed the raw route
// group name, e.g. "(auth)").
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
