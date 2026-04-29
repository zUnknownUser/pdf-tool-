import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Animated,
  Pressable,
} from "react-native";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ShieldCheck,
  FileDown,
  Lock,
  Sparkles,
  Share2,
  Zap,
  Upload,
  CheckCircle2,
  LoaderCircle,
  type LucideIcon,
} from "lucide-react-native";

const { width } = Dimensions.get("window");
const ONBOARDING_KEY = "PDF_ONBOARDING_SEEN";

type Slide = {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
};

const slides: Slide[] = [
  {
    title: "Controle seus PDFs",
    subtitle: "Comprima, converta e organize arquivos com facilidade.",
    icon: ShieldCheck,
    color: "#007AFF",
  },
  {
    title: "Ferramentas inteligentes",
    subtitle: "OCR, IA e ações rápidas em uma experiência simples.",
    icon: Sparkles,
    color: "#7C3AED",
  },
  {
    title: "Privacidade primeiro",
    subtitle: "Processamento local sempre que possível.",
    icon: Lock,
    color: "#34C759",
  },
  {
    title: "Pronto em segundos",
    subtitle: "Processe e compartilhe o resultado rapidamente.",
    icon: Share2,
    color: "#007AFF",
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const listRef = useRef<FlatList<Slide>>(null);

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/");
  }

  function next() {
    if (currentIndex < slides.length - 1) {
      listRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      finish();
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.glowBlue} />
      <View style={styles.glowPurple} />

      <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />

      <Animated.FlatList
        ref={listRef as any}
        data={slides}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.title}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        renderItem={({ item, index }) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.92, 1, 0.92],
            extrapolate: "clamp",
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: "clamp",
          });

          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [26, 0, 26],
            extrapolate: "clamp",
          });

          const MainIcon = item.icon;

          return (
            <View style={styles.slide}>
              <Animated.View
                style={[
                  styles.card,
                  {
                    opacity,
                    transform: [{ scale }, { translateY }],
                  },
                ]}
              >
                <View style={styles.header}>
                  <View
                    style={[
                      styles.iconBox,
                      { backgroundColor: `${item.color}18` },
                    ]}
                  >
                    <MainIcon size={31} color={item.color} />
                  </View>

                  <View style={styles.pill}>
                    <ShieldCheck size={13} color="#15803D" />
                    <Text style={styles.pillText}>Seguro</Text>
                  </View>
                </View>

                <MockFlow color={item.color} index={index} />

                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </Animated.View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index && styles.dotActive]}
            />
          ))}
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <Pressable
            onPress={next}
            onPressIn={() =>
              Animated.spring(buttonScale, {
                toValue: 0.96,
                useNativeDriver: true,
              }).start()
            }
            onPressOut={() =>
              Animated.spring(buttonScale, {
                toValue: 1,
                useNativeDriver: true,
              }).start()
            }
            style={styles.mainBtn}
          >
            <Zap size={18} color="#FFF" />
            <Text style={styles.mainText}>
              {currentIndex === slides.length - 1 ? "Começar" : "Continuar"}
            </Text>
          </Pressable>
        </Animated.View>

        {currentIndex < slides.length - 1 && (
          <TouchableOpacity onPress={finish}>
            <Text style={styles.skipText}>Pular</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function MockFlow({ color, index }: { color: string; index: number }) {
  const progress = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);

    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 2600,
          useNativeDriver: false,
        }),
        Animated.delay(700),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.spring(pulse, {
          toValue: 1.04,
          useNativeDriver: true,
        }),
        Animated.spring(pulse, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
  }, [index]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["18%", "100%"],
  });

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const stepOneOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [1, 0.55, 0.35],
  });

  const stepTwoOpacity = progress.interpolate({
    inputRange: [0, 0.25, 0.75, 1],
    outputRange: [0.35, 1, 1, 0.45],
  });

  const stepThreeOpacity = progress.interpolate({
    inputRange: [0, 0.65, 1],
    outputRange: [0.25, 0.4, 1],
  });

  return (
    <Animated.View style={[styles.mockBox, { transform: [{ scale: pulse }] }]}>
      <View style={styles.mockTop}>
        <View>
          <Text style={styles.mockTitle}>documento.pdf</Text>
          <Text style={styles.mockSub}>2.4 MB • PDF</Text>
        </View>

        <View style={[styles.mockIcon, { backgroundColor: `${color}18` }]}>
          <FileDown size={20} color={color} />
        </View>
      </View>

      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              width: barWidth,
              backgroundColor: color,
            },
          ]}
        />
      </View>

      <View style={styles.steps}>
        <Animated.View style={[styles.step, { opacity: stepOneOpacity }]}>
          <Upload size={16} color={color} />
          <Text style={styles.stepText}>Selecionar</Text>
        </Animated.View>

        <Animated.View style={[styles.step, { opacity: stepTwoOpacity }]}>
          <Animated.View style={{ transform: [{ rotate }] }}>
            <LoaderCircle size={16} color={color} />
          </Animated.View>
          <Text style={styles.stepText}>Processar</Text>
        </Animated.View>

        <Animated.View style={[styles.step, { opacity: stepThreeOpacity }]}>
          <CheckCircle2 size={16} color="#34C759" />
          <Text style={styles.stepText}>Pronto</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F8",
  },

  glowBlue: {
    position: "absolute",
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#007AFF22",
    top: 80,
    right: -80,
  },

  glowPurple: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#7C3AED18",
    bottom: 100,
    left: -90,
  },

  slide: {
    width,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 32,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.7)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  pill: {
    backgroundColor: "#ECFDF3",
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  pillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#15803D",
  },

  mockBox: {
    marginTop: 22,
    marginBottom: 22,
    backgroundColor: "#F7F7F8",
    borderRadius: 24,
    padding: 16,
  },

  mockTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  mockTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#111827",
  },

  mockSub: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7280",
  },

  mockIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
    marginTop: 16,
  },

  progressBar: {
    height: "100%",
    borderRadius: 999,
  },

  steps: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  stepText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#374151",
  },

  title: {
    fontSize: 25,
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
  },

  subtitle: {
    marginTop: 7,
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
    textAlign: "center",
  },

  footer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 99,
    backgroundColor: "#D1D5DB",
  },

  dotActive: {
    width: 20,
    backgroundColor: "#007AFF",
  },

  mainBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  mainText: {
    fontSize: 15,
    color: "#FFF",
    fontWeight: "900",
  },

  skipText: {
    marginTop: 10,
    textAlign: "center",
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "800",
  },
});