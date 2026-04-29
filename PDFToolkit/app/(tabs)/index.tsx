import { useCallback, useMemo, useState } from "react";
import { useEffect } from "react";
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
  ListOrdered,
  Trash2,
  Lock,
  Unlock,
  PenLine,
  Droplets,
  ScanText,
  Files,
  ChevronRight,
} from "lucide-react-native";
import { getHistory, HistoryItem } from "../../utils/history";

const FREE_LIMITS_KEY = "PDF_FREE_LIMITS";

type FreeLimits = {
  compress: { date: string; used: number; limit: number };
  ocr: { date: string; used: number; limit: number };
};

export default function HomeScreen() {
  const [recentFiles, setRecentFiles] = useState<HistoryItem[]>([]);
  const [limits, setLimits] = useState<FreeLimits>({
    compress: { date: new Date().toDateString(), used: 0, limit: 3 },
    ocr: { date: new Date().toDateString(), used: 0, limit: 2 },
  });

    
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
          compress: { date: today, used: parsed.compress?.date === today ? parsed.compress.used : 0, limit: 3 },
          ocr: { date: today, used: parsed.ocr?.date === today ? parsed.ocr.used : 0, limit: 2 },
        };

        setLimits(resetLimits);
        await AsyncStorage.setItem(FREE_LIMITS_KEY, JSON.stringify(resetLimits));
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

  function openPrivacyInfo() {
    Alert.alert(
      "Privacidade",
      "A ideia do app é processar seus arquivos localmente no celular sempre que possível. Assim, seus PDFs não precisam sair do aparelho para tarefas como comprimir, juntar, dividir ou converter."
    );
  }

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
      {/* HERO */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            <ShieldCheck size={30} color="#007AFF" />
          </View>

          <TouchableOpacity onPress={openPrivacyInfo} style={styles.privacyBtn}>
            <Text style={styles.privacyText}>Como funciona?</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.heroTitle}>Seus arquivos nunca saem do celular.</Text>
        <Text style={styles.heroText}>
          Comprima, converta e organize PDFs com privacidade total.
        </Text>
      </View>

      {/* CONTINUAR */}
      {hasRecentFiles && (
        <>
          <Text style={styles.sectionTitle}>Continuar</Text>

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
              <Text style={styles.continueSubtitle}>Último arquivo usado</Text>
            </View>

            <ChevronRight size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </>
      )}

      {/* GUIADO POR OBJETIVO */}
      <Text style={styles.sectionTitle}>O que você quer fazer?</Text>

      <View style={styles.goalGrid}>
        <GoalButton title="Reduzir tamanho" onPress={() => openAction("compress")} />
        <GoalButton title="Juntar arquivos" onPress={() => openAction("merge")} />
        <GoalButton title="Converter imagens" onPress={() => openAction("image-to-pdf")} />
        <GoalButton title="Separar páginas" onPress={() => openAction("split")} />
      </View>

      {/* FERRAMENTAS */}
      <Text style={styles.sectionTitle}>Ferramentas</Text>

      <View style={styles.toolsGrid}>
        <ActionCard
          title="Comprimir PDF"
          subtitle={`${compressRemaining} de 3 grátis hoje`}
          badge="Grátis"
          icon={<FileDown size={22} color="#007AFF" />}
          onPress={() => openAction("compress")}
        />

        <ActionCard
          title="Imagem para PDF"
          subtitle="Fotos em PDF."
          icon={<Images size={22} color="#007AFF" />}
          onPress={() => openAction("image-to-pdf")}
        />

        <ActionCard
          title="PDF para imagem"
          subtitle="Extraia páginas."
          icon={<FileImage size={22} color="#007AFF" />}
          onPress={() => openAction("pdf-to-image")}
        />

        <ActionCard
          title="Juntar PDFs"
          subtitle="Una arquivos."
          icon={<Combine size={22} color="#007AFF" />}
          onPress={() => openAction("merge")}
        />

        <ActionCard
          title="Dividir PDF"
          subtitle="Separe páginas."
          icon={<Scissors size={22} color="#007AFF" />}
          onPress={() => openAction("split")}
        />

        <ActionCard
          title="Modo lote"
          subtitle="Vários arquivos."
          badge="Novo"
          icon={<Files size={22} color="#007AFF" />}
          onPress={() => openAction("batch")}
        />
      </View>

      {/* MAIS FERRAMENTAS */}
      <Text style={styles.sectionTitle}>Mais ferramentas</Text>

      <View style={styles.toolsGrid}>
        <ActionCard
          title="Rotacionar"
          subtitle="Gire páginas."
          icon={<RotateCw size={22} color="#007AFF" />}
          onPress={() => openAction("rotate")}
        />

        <ActionCard
          title="Reordenar"
          subtitle="Mude a ordem."
          icon={<ListOrdered size={22} color="#007AFF" />}
          onPress={() => openAction("reorder")}
        />

        <ActionCard
          title="Remover páginas"
          subtitle="Apague páginas."
          icon={<Trash2 size={22} color="#007AFF" />}
          onPress={() => openAction("remove-pages")}
        />

        <ActionCard
          title="Proteger PDF"
          subtitle="Senha no arquivo."
          icon={<Lock size={22} color="#007AFF" />}
          onPress={() => openAction("protect")}
        />

        <ActionCard
          title="Desbloquear"
          subtitle="Remover senha."
          icon={<Unlock size={22} color="#007AFF" />}
          onPress={() => openAction("unlock")}
        />

        <ActionCard
          title="Assinar PDF"
          subtitle="Adicionar assinatura."
          icon={<PenLine size={22} color="#007AFF" />}
          onPress={() => openAction("sign")}
        />

        <ActionCard
          title="Marca d'água"
          subtitle="Texto ou imagem."
          icon={<Droplets size={22} color="#007AFF" />}
          onPress={() => openAction("watermark")}
        />

        <ActionCard
          title="OCR"
          subtitle={`${ocrRemaining} de 2 grátis hoje`}
          badge="IA"
          icon={<ScanText size={22} color="#007AFF" />}
          onPress={() => openAction("ocr")}
        />
      </View>

      {/* HISTÓRICO RECENTE */}
      {hasRecentFiles && (
        <>
          <Text style={styles.sectionTitle}>Recentes</Text>

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

      {/* PREMIUM */}
      <Text style={styles.sectionTitle}>Premium</Text>

      <ActionCard
        title="Desbloquear tudo"
        subtitle="Sem limites diários, batch e sem anúncios."
        badge="Premium"
        premium
        icon={<Crown size={24} color="#B45309" />}
        onPress={() => openAction("premium")}
      />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

/* ================= COMPONENTES ================= */

function GoalButton({ title, onPress }: any) {
  return (
    <TouchableOpacity activeOpacity={0.85} style={styles.goalButton} onPress={onPress}>
      <Text style={styles.goalText}>{title}</Text>
    </TouchableOpacity>
  );
}

function ActionCard({ title, subtitle, icon, badge, premium, onPress }: any) {
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
              <Text style={[styles.badgeText, premium && styles.premiumBadgeText]}>
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
  hero: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
    padding: 22,
    marginTop: 12,
    marginBottom: 24,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  privacyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
  },
  privacyText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#007AFF",
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
  },
  heroText: {
    marginTop: 8,
    fontSize: 15,
    color: "#6B7280",
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