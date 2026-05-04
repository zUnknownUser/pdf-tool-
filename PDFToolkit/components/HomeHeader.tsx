import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useTranslation } from "react-i18next";

const TIPS_KEYS = [
  "home_tip_1",
  "home_tip_2",
  "home_tip_3",
  "home_tip_4",
  "home_tip_5",
  "home_tip_6",
  "home_tip_7",
  "home_tip_8",
];

function getGreetingKey() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "greeting_morning";
  if (hour >= 12 && hour < 18) return "greeting_afternoon";

  return "greeting_evening";
}

function getDailyTipKey() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Number(new Date()) - Number(start);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  return TIPS_KEYS[dayOfYear % TIPS_KEYS.length];
}

export function HomeHeader() {
  const { t } = useTranslation();

  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wave, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(wave, {
          toValue: -1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(wave, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(wave, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
      ])
    ).start();
  }, [wave]);

  const rotate = wave.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-20deg", "20deg"],
  });

  const greeting = t(getGreetingKey()).replace(" 👋", "");

  return (
    <>
      <View style={styles.greeting}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.greetingTitle}>{greeting}</Text>

          <Animated.Text
            style={[
              styles.greetingTitle,
              {
                transform: [{ rotate }],
              },
            ]}
          >
            👋
          </Animated.Text>
        </View>

        <Text style={styles.greetingSubtitle}>
          {t("greeting_subtitle")}
        </Text>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipLabel}>{t("tip_label")}</Text>

        <Text style={styles.tipText}>
          {t(getDailyTipKey())}
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginTop: 16,
    marginBottom: 20,
    marginLeft: 4,
  },
  greetingTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  greetingSubtitle: {
    marginTop: 4,
    fontSize: 15,
    color: "#6B7280",
  },
  tipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 24,
  },
  tipLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#007AFF",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tipText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
  },
});