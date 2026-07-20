import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/auth-store';

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Home: 'home',
  Search: 'search',
  Leads: 'clipboard',
  Chat: 'chatbubble',
  Profile: 'person',
};

function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <Ionicons name={TAB_ICONS[name] ?? 'ellipse'} size={size} color={color} />;
}

// The leads route is shared by all roles but means different things \u2014 mirror the
// web sidebar labels (BUYER_TENANT \u2192 "My Inquiries", OWNER \u2192 "Tracking").
function leadsLabels(role?: string): { tab: string; header: string } {
  if (role === 'BUYER_TENANT') return { tab: 'Inquiries', header: 'My Inquiries' };
  if (role === 'OWNER') return { tab: 'Tracking', header: 'Tracking' };
  return { tab: 'Leads', header: 'Leads' };
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const role = useAuthStore((s) => s.user?.role);
  const leads = leadsLabels(role);
  // Chat is only available to roles that have masked communication on web.
  const showChat = role === 'SUPER_ADMIN' || role === 'DEALER' || role === 'BUYER_TENANT';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
          height: 56 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerTitle: 'RDN',
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#fff',
          tabBarIcon: ({ color, size }) => <TabIcon name="Home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#fff',
          tabBarIcon: ({ color, size }) => <TabIcon name="Search" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: leads.header,
          tabBarLabel: leads.tab,
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#fff',
          tabBarIcon: ({ color, size }) => <TabIcon name="Leads" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          href: showChat ? undefined : null,
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#fff',
          tabBarIcon: ({ color, size }) => <TabIcon name="Chat" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerStyle: { backgroundColor: '#2563eb' },
          headerTintColor: '#fff',
          tabBarIcon: ({ color, size }) => <TabIcon name="Profile" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
