import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

const TIPS = [
  "Use o Modo Lote pra comprimir vários PDFs de uma vez.",
  "Dá pra juntar imagens e PDFs em um único arquivo.",
  "O OCR transforma PDF escaneado em texto pesquisável.",
  "Você pode proteger qualquer PDF com senha em segundos.",
  "Dividir um PDF grande facilita o envio por e-mail.",
  "A câmera do app escaneia documentos direto em PDF.",
  "Marca d'água protege seus documentos de cópias.",
  "Dá pra remover páginas específicas sem abrir o arquivo.",
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia 👋";
  if (hour >= 12 && hour < 18) return "Boa tarde 👋";
  return "Boa noite 👋";
}

function getDailyTip() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const diff = Number(new Date()) - Number(start);
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return TIPS[dayOfYear % TIPS.length];
}

export function HomeHeader() {
  const wave = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(wave, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(wave, { toValue: -1, duration: 200, useNativeDriver: true }),
        Animated.timing(wave, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(wave, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.delay(2000), 
      ])
    ).start();
  }, []);

  const rotate = wave.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-20deg", "20deg"],
  });

  return (
    <>
      <View style={styles.greeting}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={styles.greetingTitle}>{getGreeting().replace(" 👋", "")}</Text>
         <Animated.Text
  style={[
    styles.greetingTitle,
    {
      transform: [{ rotate }],
      display: "flex",
      transformOrigin: "bottom center", 
    }
  ]}
>
  👋
</Animated.Text>
        </View>
        <Text style={styles.greetingSubtitle}>O que vamos resolver hoje?</Text>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipLabel}>💡 Dica do dia</Text>
        <Text style={styles.tipText}>{getDailyTip()}</Text>
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