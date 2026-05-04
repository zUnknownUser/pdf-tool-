import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";

import {
  Crown,
  Zap,
  Layers,
  ShieldCheck,
  Infinity,
  Check,
  Star,
  BanIcon,
  Sparkles,
} from "lucide-react-native";

import { useTranslation } from "react-i18next";
import { presentPaywall } from "@/lib/revenuecat";

const features = [
  { icon: Infinity, labelKey: "premium_feature_unlimited_conversions" },
  { icon: Layers, labelKey: "premium_feature_batch" },
  { icon: BanIcon, labelKey: "premium_feature_no_daily_limits" },
  { icon: ShieldCheck, labelKey: "premium_feature_protect_unlock" },
  { icon: Zap, labelKey: "premium_feature_ai_ocr" },
  { icon: Star, labelKey: "premium_feature_early_access" },
];

const plans = [
  {
    id: "monthly",
    labelKey: "premium_plan_monthly_label",
    titleKey: "premium_plan_monthly_title",
    descriptionKey: "premium_plan_monthly_description",
    highlight: false,
    badgeKey: null,
  },
  {
    id: "annual",
    labelKey: "premium_plan_annual_label",
    titleKey: "premium_plan_annual_title",
    descriptionKey: "premium_plan_annual_description",
    highlight: true,
    badgeKey: "premium_plan_recommended",
  },
];

export default function PremiumScreen() {
  const { t } = useTranslation();

  async function handleSubscribe() {
    try {
      const success = await presentPaywall();

      if (success) {
        Alert.alert(
          t("alert_premium_title"),
          t("alert_premium_message")
        );
      }
    } catch (error) {
      console.log(t("premium_error_log"), error);

      Alert.alert(
        t("premium_error_title"),
        t("premium_error_message")
      );
    }
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Crown size={28} color="#B45309" />
        </View>

        <Text style={styles.heroTitle}>{t("premium_hero_title")}</Text>

        <Text style={styles.heroText}>{t("premium_hero_text")}</Text>
      </View>

      {/* Features */}
      <Text style={styles.sectionTitle}>{t("premium_features_title")}</Text>

      <View style={styles.featuresCard}>
        {features.map(({ icon: Icon, labelKey }, index) => (
          <View
            key={labelKey}
            style={[
              styles.featureRow,
              index < features.length - 1 && styles.featureRowBorder,
            ]}
          >
            <View style={styles.featureIcon}>
              <Icon size={16} color="#B45309" />
            </View>

            <Text style={styles.featureLabel}>{t(labelKey)}</Text>

            <Check size={16} color="#34C759" />
          </View>
        ))}
      </View>

      {/* Plans */}
      <Text style={styles.sectionTitle}>{t("premium_plans_title")}</Text>

      <View style={styles.plansRow}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            activeOpacity={0.85}
            onPress={handleSubscribe}
            style={[styles.planCard, plan.highlight && styles.planCardActive]}
          >
            {plan.badgeKey && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t(plan.badgeKey)}</Text>
              </View>
            )}

            <Text
              style={[
                styles.planLabel,
                plan.highlight && styles.planLabelActive,
              ]}
            >
              {t(plan.labelKey)}
            </Text>

            <Text
              style={[
                styles.planTitle,
                plan.highlight && styles.planTitleActive,
              ]}
            >
              {t(plan.titleKey)}
            </Text>

            <Text style={styles.planDescription}>
              {t(plan.descriptionKey)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.mainBtn}
        activeOpacity={0.88}
        onPress={handleSubscribe}
      >
        <Sparkles size={18} color="#FFF" />
        <Text style={styles.mainText}>{t("premium_cta")}</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>{t("premium_disclaimer")}</Text>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F8",
    paddingHorizontal: 18,
  },
  hero: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 22,
    marginTop: 12,
    marginBottom: 24,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "#FFF4D6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#111827",
  },
  heroText: {
    marginTop: 8,
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 21,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 10,
    marginLeft: 4,
  },
  featuresCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  featureRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#FFF4D6",
    alignItems: "center",
    justifyContent: "center",
  },
  featureLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  plansRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: "center",
    position: "relative",
    borderWidth: 2,
    borderColor: "transparent",
    minHeight: 150,
    justifyContent: "center",
  },
  planCardActive: {
    borderColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  badge: {
    position: "absolute",
    top: -11,
    backgroundColor: "#F59E0B",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  planLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  planLabelActive: {
    color: "#B45309",
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },
  planTitleActive: {
    color: "#92400E",
  },
  planDescription: {
    marginTop: 8,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 17,
  },
  mainBtn: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  mainText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 12,
    color: "#9CA3AF",
    lineHeight: 18,
  },
});