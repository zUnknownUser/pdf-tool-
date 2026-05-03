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

import { presentPaywall } from "@/lib/revenuecat";

const features = [
  { icon: Infinity, label: "Conversões ilimitadas por dia" },
  { icon: Layers, label: "Processamento em lote (batch)" },
  { icon: BanIcon, label: "Sem limites diários" },
  { icon: ShieldCheck, label: "Proteção e desbloqueio de PDFs" },
  { icon: Zap, label: "OCR com IA ilimitado" },
  { icon: Star, label: "Acesso antecipado a novidades" },
];

const plans = [
  {
    id: "monthly",
    label: "Mensal",
    title: "Plano flexível",
    description: "Ideal para usar quando precisar.",
    highlight: false,
    badge: null,
  },
  {
    id: "annual",
    label: "Anual",
    title: "Melhor custo-benefício",
    description: "Economize assinando por ano.",
    highlight: true,
    badge: "Recomendado",
  },
];

export default function PremiumScreen() {
  async function handleSubscribe() {
    try {
      const success = await presentPaywall();
      if (success) {
        Alert.alert("Premium ativado", "Seu acesso Premium foi liberado.");
      }
    } catch (error) {
      console.log("Erro ao abrir paywall:", error);
      Alert.alert("Erro", "Não foi possível abrir a tela de assinatura.");
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

        <Text style={styles.heroTitle}>PDF Toolkit Premium</Text>

        <Text style={styles.heroText}>
          Processe sem limites, sem interrupções e com total privacidade.
        </Text>
      </View>

      {/* Features */}
      <Text style={styles.sectionTitle}>O que você ganha</Text>

      <View style={styles.featuresCard}>
        {features.map(({ icon: Icon, label }, index) => (
          <View
            key={label}
            style={[
              styles.featureRow,
              index < features.length - 1 && styles.featureRowBorder,
            ]}
          >
            <View style={styles.featureIcon}>
              <Icon size={16} color="#B45309" />
            </View>

            <Text style={styles.featureLabel}>{label}</Text>

            <Check size={16} color="#34C759" />
          </View>
        ))}
      </View>

      {/* Plans */}
      <Text style={styles.sectionTitle}>Escolha seu plano</Text>

      <View style={styles.plansRow}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            activeOpacity={0.85}
            onPress={handleSubscribe}
            style={[styles.planCard, plan.highlight && styles.planCardActive]}
          >
            {plan.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{plan.badge}</Text>
              </View>
            )}

            <Text style={[styles.planLabel, plan.highlight && styles.planLabelActive]}>
              {plan.label}
            </Text>

            <Text style={[styles.planTitle, plan.highlight && styles.planTitleActive]}>
              {plan.title}
            </Text>

            <Text style={styles.planDescription}>{plan.description}</Text>
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
        <Text style={styles.mainText}>Assinar agora</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        Os preços reais aparecem na tela segura da RevenueCat · Cancele quando
        quiser · Renovação automática
      </Text>

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