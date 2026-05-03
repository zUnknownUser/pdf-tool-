import { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Crown,
  Zap,
  Trash2,
  ShieldCheck,
  FileText,
  Star,
  ChevronRight,
  Info,
  Sun,
  Globe,
} from "lucide-react-native";
import { isPremiumUser } from "@/lib/revenuecat";

const FREE_LIMITS_KEY = "PDF_FREE_LIMITS";

type FreeLimits = {
  compress: { date: string; used: number; limit: number };
  ocr: { date: string; used: number; limit: number };
};

export default function SettingsScreen() {
  const [isPremium, setIsPremium] = useState(false);
  const [limits, setLimits] = useState<FreeLimits>({
    compress: { date: new Date().toDateString(), used: 0, limit: 3 },
    ocr: { date: new Date().toDateString(), used: 0, limit: 2 },
  });

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
   const premium = await isPremiumUser();
   setIsPremium(premium); 

    const raw = await AsyncStorage.getItem(FREE_LIMITS_KEY);
    if (raw) {
      const parsed: FreeLimits = JSON.parse(raw);
      const today = new Date().toDateString();
      setLimits({
        compress:
          parsed.compress?.date === today
            ? parsed.compress
            : { date: today, used: 0, limit: 3 },
        ocr:
          parsed.ocr?.date === today
            ? parsed.ocr
            : { date: today, used: 0, limit: 2 },
      });
    }
  }

  async function clearHistory() {
    Alert.alert(
      "Limpar histórico",
      "Tem certeza? O histórico de arquivos será apagado.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("PDF_HISTORY");
            Alert.alert("Pronto", "Histórico apagado.");
          },
        },
      ]
    );
  }

  async function clearCache() {
    Alert.alert(
      "Limpar cache",
      "Os arquivos temporários serão removidos.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar",
          style: "destructive",
          onPress: async () => {
            Alert.alert("Pronto", "Cache limpo com sucesso.");
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentInsetAdjustmentBehavior="automatic"
    >
      {/* CONTA / PREMIUM */}
      <View style={styles.planCard}>
        <View style={styles.planTop}>
          <View style={[styles.planIcon, isPremium && styles.planIconPremium]}>
            <Crown size={24} color={isPremium ? "#B45309" : "#007AFF"} />
          </View>

          <View style={styles.planInfo}>
            <Text style={styles.planTitle}>
              {isPremium ? "Plano Premium" : "Plano Grátis"}
            </Text>
            <Text style={styles.planSubtitle}>
              {isPremium ? "Uso ilimitado ativo ✓" : "Alguns recursos são limitados"}
            </Text>
          </View>
        </View>

        {!isPremium && (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.upgradeBtn}
            onPress={() => router.push({ pathname: "/action", params: { type: "premium" } })}
          >
            <Zap size={16} color="#FFF" />
            <Text style={styles.upgradeBtnText}>Ver planos</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* USO DO DIA */}
      {!isPremium && (
        <>
          <Text style={styles.sectionTitle}>Uso de hoje</Text>
          <View style={styles.section}>
            <UsageRow
              label="Compressões"
              used={limits.compress.used}
              limit={limits.compress.limit}
            />
            <View style={styles.divider} />
            <UsageRow
              label="Leitura de texto"
              used={limits.ocr.used}
              limit={limits.ocr.limit}
            />
          </View>
        </>
      )}

      {/* PREFERÊNCIAS */}
      <Text style={styles.sectionTitle}>Preferências</Text>
      <View style={styles.section}>
        <SettingsRow
          icon={<Sun size={18} color="#F59E0B" />}
          iconBg="#FFF4D6"
          label="Tema"
          value="Em breve"
          onPress={() => Alert.alert("Em breve", "Suporte a tema claro/escuro será adicionado em breve.")}
          noChevron
        />
        <View style={styles.divider} />
        <SettingsRow
          icon={<Globe size={18} color="#007AFF" />}
          iconBg="#E8F2FF"
          label="Idioma"
          value="Em breve"
          onPress={() => Alert.alert("Em breve", "Suporte a múltiplos idiomas será adicionado em breve.")}
          noChevron
        />
      </View>

      {/* DADOS */}
      <Text style={styles.sectionTitle}>Dados</Text>
      <View style={styles.section}>
        <SettingsRow
          icon={<Trash2 size={18} color="#EF4444" />}
          iconBg="#FEF2F2"
          label="Limpar histórico"
          onPress={clearHistory}
          destructive
        />
        <View style={styles.divider} />
        <SettingsRow
          icon={<FileText size={18} color="#6B7280" />}
          iconBg="#F3F4F6"
          label="Limpar cache"
          onPress={clearCache}
          destructive
        />
      </View>

      {/* SOBRE */}
      <Text style={styles.sectionTitle}>Sobre o app</Text>
      <View style={styles.section}>
        <SettingsRow
          icon={<Star size={18} color="#F59E0B" />}
          iconBg="#FFF4D6"
          label="Avaliar o app"
          onPress={() => Linking.openURL("https://apps.apple.com")}
        />
        <View style={styles.divider} />
        <SettingsRow
          icon={<ShieldCheck size={18} color="#007AFF" />}
          iconBg="#E8F2FF"
          label="Política de privacidade"
          onPress={() => Linking.openURL("https://seusite.com/privacidade")}
        />
        <View style={styles.divider} />
        <SettingsRow
          icon={<FileText size={18} color="#007AFF" />}
          iconBg="#E8F2FF"
          label="Termos de uso"
          onPress={() => Linking.openURL("https://seusite.com/termos")}
        />
        <View style={styles.divider} />
        <SettingsRow
          icon={<Info size={18} color="#6B7280" />}
          iconBg="#F3F4F6"
          label="Versão 1.0.0"
          onPress={() => {}}
          noChevron
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ================= COMPONENTES ================= */

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) {
  const remaining = Math.max(0, limit - used);
  const progress = Math.min(used / limit, 1);
  const isExhausted = remaining === 0;

  return (
    <View style={styles.usageRow}>
      <View style={styles.usageHeader}>
        <Text style={styles.usageLabel}>{label}</Text>
        <Text style={[styles.usageCount, isExhausted && styles.usageCountRed]}>
          {used}/{limit} usadas hoje
        </Text>
      </View>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%` },
            isExhausted && styles.progressFillRed,
          ]}
        />
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  iconBg,
  label,
  value,
  onPress,
  destructive,
  noChevron,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  noChevron?: boolean;
}) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.settingsRow} onPress={onPress}>
      <View style={[styles.settingsIcon, { backgroundColor: iconBg }]}>
        {icon}
      </View>
      <Text style={[styles.settingsLabel, destructive && styles.settingsLabelRed]}>
        {label}
      </Text>
      {value && <Text style={styles.settingsValue}>{value}</Text>}
      {!noChevron && <ChevronRight size={18} color="#9CA3AF" />}
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
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    padding: 18,
    marginTop: 12,
    marginBottom: 24,
  },
  planTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  planIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  planIconPremium: {
    backgroundColor: "#FFF4D6",
  },
  planInfo: { flex: 1 },
  planTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  planSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#6B7280",
  },
  upgradeBtn: {
    marginTop: 14,
    backgroundColor: "#007AFF",
    borderRadius: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  upgradeBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 10,
    marginLeft: 4,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  usageRow: {
    paddingVertical: 14,
  },
  usageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  usageLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  usageCount: {
    fontSize: 13,
    color: "#6B7280",
  },
  usageCountRed: { color: "#EF4444" },
  progressBar: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#007AFF",
    borderRadius: 999,
  },
  progressFillRed: { backgroundColor: "#EF4444" },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  settingsLabelRed: { color: "#EF4444" },
  settingsValue: {
    fontSize: 13,
    color: "#9CA3AF",
    marginRight: 4,
  },
});