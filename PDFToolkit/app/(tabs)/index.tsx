import { useCallback, useMemo, useState, useLayoutEffect, useEffect } from "react";
import { HomeHeader } from "../../components/HomeHeader";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";
import {
  FileDown,
  Images,
  FileImage,
  Combine,
  Scissors,
  Crown,
  ShieldCheck,
  Clock,
  RotateCw,
  Trash2,
  Camera,
  Lock,
  Unlock,
  PenLine,
  Droplets,
  ScanText,
  Files,
  FileText,
  ChevronRight,
} from "lucide-react-native";
import { getHistory, HistoryItem } from "../../utils/history";
import { useNavigation } from "@react-navigation/native";

const FREE_LIMITS_KEY = "PDF_FREE_LIMITS";

type FreeLimits = {
  compress: { date: string; used: number; limit: number };
  ocr: { date: string; used: number; limit: number };
};

export default function HomeScreen() {
  const { t } = useTranslation();

  const [recentFiles, setRecentFiles] = useState<HistoryItem[]>([]);
  const [limits, setLimits] = useState<FreeLimits>({
    compress: { date: new Date().toDateString(), used: 0, limit: 3 },
    ocr: { date: new Date().toDateString(), used: 0, limit: 2 },
  });

  const navigation = useNavigation();

  const openPrivacyInfo = useCallback(() => {
    Alert.alert(
      t("privacy_alert_title"),
      t("privacy_alert_message")
    );
  }, [t]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={openPrivacyInfo}
          style={{ marginRight: 4 }}
          activeOpacity={0.75}
        >
          <ShieldCheck size={22} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, openPrivacyInfo]);

  useEffect(() => {
    async function checkOnboarding() {
      const seen = await AsyncStorage.getItem("PDF_ONBOARDING_SEEN");

      if (!seen) {
        router.replace("/onboarding" as any);
      }
    }

    checkOnboarding();
  }, []);

  function openAction(type: string) {
    router.push({ pathname: "/action", params: { type } });
  }

  async function loadHomeData() {
    const history = await getHistory();
    setRecentFiles(history.slice(0, 3));

    const savedLimits = await AsyncStorage.getItem(FREE_LIMITS_KEY);

    if (savedLimits) {
      const parsed: FreeLimits = JSON.parse(savedLimits);
      const today = new Date().toDateString();

      const needsReset =
        parsed.compress?.date !== today || parsed.ocr?.date !== today;

      if (needsReset) {
        const resetLimits: FreeLimits = {
          compress: {
            date: today,
            used: parsed.compress?.date === today ? parsed.compress.used : 0,
            limit: 3,
          },
          ocr: {
            date: today,
            used: parsed.ocr?.date === today ? parsed.ocr.used : 0,
            limit: 2,
          },
        };

        setLimits(resetLimits);

        await AsyncStorage.setItem(
          FREE_LIMITS_KEY,
          JSON.stringify(resetLimits)
        );
      } else {
        setLimits(parsed);
      }
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [])
  );

  const compressRemaining = useMemo(
    () => Math.max(0, limits.compress.limit - limits.compress.used),
    [limits]
  );

  const ocrRemaining = useMemo(
    () => Math.max(0, limits.ocr.limit - limits.ocr.used),
    [limits]
  );

  function openRecentFile(item: HistoryItem) {
    router.push({
      pathname: "/action",
      params: { type: "preview", uri: item.uri, name: item.name },
    });
  }

  const hasRecentFiles = recentFiles.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <HomeHeader />

      {hasRecentFiles && (
        <>
          <Text style={styles.sectionTitle}>{t("section_continue")}</Text>

          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.continueCard}
            onPress={() => openRecentFile(recentFiles[0])}
          >
            <View style={styles.continueIcon}>
              <Clock size={22} color="#007AFF" />
            </View>

            <View style={styles.continueContent}>
              <Text style={styles.continueTitle} numberOfLines={1}>
                {recentFiles[0].name}
              </Text>

              <Text style={styles.continueSubtitle}>
                {t("last_file")}
              </Text>
            </View>

            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </>
      )}

      <Text style={styles.sectionTitle}>{t("section_goal")}</Text>

      <View style={styles.goalGrid}>
        <GoalButton
          title={t("goal_compress")}
          onPress={() => openAction("compress")}
        />

        <GoalButton
          title={t("goal_merge")}
          onPress={() => openAction("merge")}
        />

        <GoalButton
          title={t("goal_image")}
          onPress={() => openAction("image-to-pdf")}
        />

        <GoalButton
          title={t("goal_split")}
          onPress={() => openAction("split")}
        />
      </View>

      <Text style={styles.sectionTitle}>{t("section_tools")}</Text>

      <View style={styles.toolsGrid}>
        <ActionCard
          title={t("tool_compress")}
          subtitle={t("tool_compress_remaining", {
            remaining: compressRemaining,
          })}
          badge={t("badge_free")}
          icon={<FileDown size={22} color="#007AFF" />}
          onPress={() => openAction("compress")}
        />

        <ActionCard
          title={t("tool_image_pdf")}
          subtitle={t("tool_image_pdf_sub")}
          icon={<Images size={22} color="#007AFF" />}
          onPress={() => openAction("image-to-pdf")}
        />

        <ActionCard
          title={t("tool_pdf_word")}
          subtitle={t("tool_pdf_word_sub")}
          icon={<FileText size={22} color="#007AFF" />}
          onPress={() => openAction("pdf-to-word")}
        />

        <ActionCard
          title={t("tool_merge")}
          subtitle={t("tool_merge_sub")}
          icon={<Combine size={22} color="#007AFF" />}
          onPress={() => openAction("merge")}
        />

        <ActionCard
          title={t("tool_split")}
          subtitle={t("tool_split_sub")}
          icon={<Scissors size={22} color="#007AFF" />}
          onPress={() => openAction("split")}
        />

        <ActionCard
          title={t("tool_batch")}
          subtitle={t("tool_batch_sub")}
          badge={t("badge_new")}
          icon={<Files size={22} color="#007AFF" />}
          onPress={() => openAction("batch")}
        />
      </View>

      <Text style={styles.sectionTitle}>{t("section_more_tools")}</Text>

      <View style={styles.toolsGrid}>
        <ActionCard
          title={t("tool_rotate")}
          subtitle={t("tool_rotate_sub")}
          icon={<RotateCw size={22} color="#007AFF" />}
          onPress={() => openAction("rotate")}
        />

        <ActionCard
          title={t("tool_scan")}
          subtitle={t("tool_scan_sub")}
          badge={t("badge_new")}
          icon={<Camera size={22} color="#007AFF" />}
          onPress={() => openAction("scan")}
        />

        <ActionCard
          title={t("tool_remove")}
          subtitle={t("tool_remove_sub")}
          icon={<Trash2 size={22} color="#007AFF" />}
          onPress={() => openAction("remove-pages")}
        />

        <ActionCard
          title={t("tool_protect")}
          subtitle={t("tool_protect_sub")}
          icon={<Lock size={22} color="#007AFF" />}
          onPress={() => openAction("protect")}
        />

        <ActionCard
          title={t("tool_unlock")}
          subtitle={t("tool_unlock_sub")}
          icon={<Unlock size={22} color="#007AFF" />}
          onPress={() => openAction("unlock")}
        />

        <ActionCard
          title={t("tool_sign")}
          subtitle={t("tool_sign_sub")}
          icon={<PenLine size={22} color="#007AFF" />}
          onPress={() => openAction("sign")}
        />

        <ActionCard
          title={t("tool_watermark")}
          subtitle={t("tool_watermark_sub")}
          icon={<Droplets size={22} color="#007AFF" />}
          onPress={() => openAction("watermark")}
        />

        <ActionCard
          title={t("tool_ocr")}
          subtitle={t("tool_ocr_remaining", {
            remaining: ocrRemaining,
          })}
          badge={t("badge_ai")}
          icon={<ScanText size={22} color="#007AFF" />}
          onPress={() => openAction("ocr")}
        />
      </View>

      {hasRecentFiles && (
        <>
          <Text style={styles.sectionTitle}>{t("section_recent")}</Text>

          <View style={styles.recentBox}>
            {recentFiles.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={styles.recentItem}
                onPress={() => openRecentFile(item)}
              >
                <View style={styles.recentIcon}>
                  <FileImage size={18} color="#007AFF" />
                </View>

                <View style={styles.recentInfo}>
                  <Text style={styles.recentName} numberOfLines={1}>
                    {item.name}
                  </Text>

                  <Text style={styles.recentDate}>
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>

                <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={styles.sectionTitle}>{t("section_premium")}</Text>

      <ActionCard
        title={t("tool_premium")}
        subtitle={t("tool_premium_sub")}
        badge={t("badge_premium")}
        premium
        icon={<Crown size={24} color="#B45309" />}
        onPress={() => openAction("premium")}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ================= COMPONENTES ================= */

function GoalButton({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.goalButton}
      onPress={onPress}
    >
      <Text style={styles.goalText}>{title}</Text>
    </TouchableOpacity>
  );
}

function ActionCard({
  title,
  subtitle,
  icon,
  badge,
  premium,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  badge?: string;
  premium?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.card, premium ? styles.premiumCard : styles.gridCard]}
    >
      <View style={[styles.iconBox, premium && styles.premiumIconBox]}>
        {icon}
      </View>

      <View style={styles.cardContent}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>{title}</Text>

          {badge && (
            <View style={[styles.badge, premium && styles.premiumBadge]}>
              <Text
                style={[
                  styles.badgeText,
                  premium && styles.premiumBadgeText,
                ]}
              >
                {badge}
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.cardSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F8",
    paddingHorizontal: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 10,
    marginLeft: 4,
  },
  continueCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 14,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  continueIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  continueContent: { flex: 1 },
  continueTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#111827",
  },
  continueSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },
  goalGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  goalButton: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  goalText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },
  toolsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 13,
    marginBottom: 10,
  },
  gridCard: {
    width: "48%",
    minHeight: 112,
  },
  premiumCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  premiumIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#FFF4D6",
    marginBottom: 0,
  },
  cardContent: { flex: 1 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  cardSubtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#EEF2FF",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#007AFF",
  },
  premiumBadge: { backgroundColor: "#FFF4D6" },
  premiumBadgeText: { color: "#B45309" },
  recentBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 6,
    marginBottom: 20,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 16,
  },
  recentIcon: {
    width: 36,
    height: 36,
    borderRadius: 13,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  recentInfo: { flex: 1 },
  recentName: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111827",
  },
  recentDate: {
    marginTop: 2,
    fontSize: 11,
    color: "#6B7280",
  },
});