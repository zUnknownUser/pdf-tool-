import { Tabs } from "expo-router";
import { Home, Clock, Crown } from "lucide-react-native";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#007AFF",
        headerStyle: {
          backgroundColor: "#F7F7F8",
        },
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E5E7EB",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("section_tools"),
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          title: t("history_title"),
          tabBarIcon: ({ color, size }) => (
            <Clock size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="premium"
        options={{
          title: t("section_premium"),
          tabBarIcon: ({ color, size }) => (
            <Crown size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}