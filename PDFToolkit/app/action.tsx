import { useMemo, useState } from "react";
import { styles } from "../styles/action.styles";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { saveToHistory } from "../utils/history";

import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";
import TextRecognition from "@react-native-ml-kit/text-recognition";

import {
  File,
  Upload,
  Zap,
  Lock,
  CheckCircle2,
  Share2,
  Images,
  Combine,
  Scissors,
  RotateCw,
  ListOrdered,
  Trash2,
  Unlock,
  PenLine,
  Droplets,
  ScanText,
  Files,
  Sparkles,
  Eye,
  Crown,
  Brain,
  Copy,
} from "lucide-react-native";

const AI_API_URL = "http://192.168.0.36:3000/ai/pdf-tools";

const presets = [
  "WhatsApp 16MB",
  "Email 10MB",
  "Concurso 2MB",
  "Receita 3MB",
  "LinkedIn 5MB",
];

const titles: Record<string, string> = {
  compress: "Comprimir PDF",
  "image-to-pdf": "Imagem para PDF",
  "pdf-to-image": "PDF para imagem",
  merge: "Juntar PDFs",
  split: "Dividir PDF",
  batch: "Modo lote",
  "smart-picker": "Ação inteligente",
  rotate: "Rotacionar PDF",
  reorder: "Reordenar páginas",
  "remove-pages": "Remover páginas",
  protect: "Proteger PDF",
  unlock: "Desbloquear PDF",
  sign: "Assinar PDF",
  watermark: "Marca d’água",
  ocr: "OCR com IA",
  preview: "Visualizar PDF",
  premium: "Premium",
};

function formatBytes(bytes?: number | null) {
  if (!bytes) return "Tamanho desconhecido";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default function ActionScreen() {
  const params = useLocalSearchParams<{
    type: string;
    uri?: string;
    name?: string;
  }>();

  const type = params.type ?? "compress";

  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [fileName, setFileName] = useState<string | null>(params.name ?? null);
  const [fileUri, setFileUri] = useState<string | null>(params.uri ?? null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [outputUri, setOutputUri] = useState<string | null>(params.uri ?? null);
  const [processed, setProcessed] = useState(!!params.uri);
  const [loading, setLoading] = useState(false);

  const [password, setPassword] = useState("");
  const [watermarkText, setWatermarkText] = useState("");
  const [pageRange, setPageRange] = useState("");

  const [ocrText, setOcrText] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const title = useMemo(() => titles[type] ?? "Processar arquivo", [type]);

  const icon = useMemo(() => {
    if (type === "image-to-pdf") return <Images size={26} color="#007AFF" />;
    if (type === "merge") return <Combine size={26} color="#007AFF" />;
    if (type === "split") return <Scissors size={26} color="#007AFF" />;
    if (type === "batch") return <Files size={26} color="#007AFF" />;
    if (type === "smart-picker") return <Sparkles size={26} color="#7C3AED" />;
    if (type === "rotate") return <RotateCw size={26} color="#007AFF" />;
    if (type === "reorder") return <ListOrdered size={26} color="#007AFF" />;
    if (type === "remove-pages") return <Trash2 size={26} color="#007AFF" />;
    if (type === "protect") return <Lock size={26} color="#007AFF" />;
    if (type === "unlock") return <Unlock size={26} color="#007AFF" />;
    if (type === "sign") return <PenLine size={26} color="#007AFF" />;
    if (type === "watermark") return <Droplets size={26} color="#007AFF" />;
    if (type === "ocr") return <ScanText size={26} color="#007AFF" />;
    if (type === "preview") return <Eye size={26} color="#007AFF" />;
    if (type === "premium") return <Crown size={26} color="#B45309" />;

    return <File size={26} color="#007AFF" />;
  }, [type]);

  const subtitle = useMemo(() => {
    if (type === "ocr") {
      return "Extraia texto de imagens e use IA para resumir, explicar ou gerar perguntas.";
    }

    if (type === "smart-picker") {
      return "Selecione um arquivo e o app sugere a melhor ação.";
    }

    if (type === "batch") {
      return "Selecione vários arquivos para processar em lote.";
    }

    if (type === "preview") {
      return "Abra, confira e compartilhe seu PDF.";
    }

    if (type === "premium") {
      return "Libere processamento ilimitado e ferramentas avançadas.";
    }

    return "Escolha o arquivo e processe em segundos.";
  }, [type]);

  const requiresMultiplePdf =
    type === "merge" || type === "batch" || type === "smart-picker";

  async function pickFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type:
          type === "image-to-pdf" || type === "ocr"
            ? "image/*"
            : type === "smart-picker"
            ? "*/*"
            : "application/pdf",
        multiple: requiresMultiplePdf,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const assets = result.assets;

      setSelectedFiles(assets);
      setSelectedImages([]);

      if (assets.length === 1) {
        const file = assets[0];

        setFileName(file.name);
        setFileUri(file.uri);
        setFileSize(file.size ?? null);
      } else {
        setFileName(`${assets.length} arquivos selecionados`);
        setFileUri(assets[0]?.uri ?? null);
        setFileSize(null);
      }

      setOutputUri(null);
      setProcessed(false);
      setOcrText("");
      setAiResult("");

      if (type === "smart-picker") suggestAction(assets);
    } catch {
      Alert.alert("Erro", "Falha ao selecionar arquivo.");
    }
  }

  async function pickImageFromGallery() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permissão necessária", "Permita acesso à galeria.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: type === "image-to-pdf",
        quality: 1,
      });

      if (result.canceled) return;

      const images = result.assets;

      setFileName(
        images.length === 1
          ? "1 imagem selecionada"
          : `${images.length} imagens selecionadas`
      );

      setFileUri(images[0]?.uri ?? null);
      setFileSize(images[0]?.fileSize ?? null);
      setSelectedImages(images);
      setSelectedFiles([]);
      setOutputUri(null);
      setProcessed(false);
      setOcrText("");
      setAiResult("");
    } catch {
      Alert.alert("Erro", "Não foi possível abrir a galeria.");
    }
  }

  function suggestAction(files: any[]) {
    if (files.length > 1) {
      const allPdf = files.every((f) =>
        String(f.mimeType || f.name).toLowerCase().includes("pdf")
      );

      if (allPdf) {
        Alert.alert(
          "Sugestão",
          "Você selecionou vários PDFs. A melhor ação parece ser: Juntar PDFs."
        );
        return;
      }
    }

    const first = files[0];
    const name = String(first?.name ?? "").toLowerCase();
    const mime = String(first?.mimeType ?? "").toLowerCase();

    if (mime.includes("image") || name.endsWith(".jpg") || name.endsWith(".png")) {
      Alert.alert(
        "Sugestão",
        "Você selecionou uma imagem. A melhor ação parece ser: Imagem para PDF ou OCR."
      );
      return;
    }

    if (first?.size && first.size > 10 * 1024 * 1024) {
      Alert.alert(
        "Sugestão",
        "Esse PDF parece grande. A melhor ação parece ser: Comprimir PDF."
      );
      return;
    }

    Alert.alert(
      "Sugestão",
      "Arquivo identificado. Você pode comprimir, dividir, proteger ou compartilhar."
    );
  }

  async function runOCR() {
    if (!fileUri) {
      Alert.alert("Selecione uma imagem primeiro.");
      return;
    }

    try {
      setLoading(true);
      setAiResult("");

      const result = await TextRecognition.recognize(fileUri);
      const text = result?.text?.trim() ?? "";

      if (!text) {
        Alert.alert("OCR concluído", "Nenhum texto foi encontrado na imagem.");
        return;
      }

      setOcrText(text);
      setProcessed(true);

      Alert.alert("OCR concluído", "Texto extraído com sucesso.");
    } catch {
      Alert.alert(
        "Erro no OCR",
        "Não foi possível ler o texto da imagem. Essa função precisa rodar em Dev Build ou build nativa, não no Expo Go."
      );
    } finally {
      setLoading(false);
    }
  }

  async function askAI(action: "summary" | "important" | "questions" | "explain") {
    if (!ocrText) {
      Alert.alert("Faça o OCR primeiro.");
      return;
    }

    try {
      setAiLoading(true);

      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          text: ocrText,
        }),
      });

      if (!response.ok) {
        throw new Error("AI request failed");
      }

      const data = await response.json();

      setAiResult(data.result ?? "A IA não retornou resultado.");
    } catch {
      Alert.alert(
        "Erro na IA",
        "Não foi possível usar a IA agora. Verifique sua API."
      );
    } finally {
      setAiLoading(false);
    }
  }

  async function imagesToPdf(images: any[]) {
    let htmlImages = "";

    for (const img of images) {
      const base64 = await FileSystem.readAsStringAsync(img.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      htmlImages += `
        <div class="page">
          <img src="data:image/jpeg;base64,${base64}" />
        </div>
      `;
    }

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; background: #ffffff; }
            .page {
              width: 100%;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              box-sizing: border-box;
              page-break-after: always;
            }
            img {
              max-width: 100%;
              max-height: 100%;
              object-fit: contain;
            }
          </style>
        </head>
        <body>${htmlImages}</body>
      </html>
    `;

    const pdf = await Print.printToFileAsync({
      html,
      base64: false,
    });

    const newFileName = `pdftoolkit-${Date.now()}.pdf`;
    const newUri = `${FileSystem.documentDirectory}${newFileName}`;

    await FileSystem.copyAsync({
      from: pdf.uri,
      to: newUri,
    });

    return newUri;
  }

  async function imageToPdf(imageUri: string) {
    return imagesToPdf([{ uri: imageUri }]);
  }

  async function fakeCopyPdf(actionName: string) {
    if (!fileUri) {
      Alert.alert("Selecione um PDF primeiro.");
      return null;
    }

    const safeName = `${actionName
      .toLowerCase()
      .replace(/\s+/g, "-")}-${Date.now()}.pdf`;

    const newUri = `${FileSystem.documentDirectory}${safeName}`;

    await FileSystem.copyAsync({
      from: fileUri,
      to: newUri,
    });

    return newUri;
  }

  async function protectPdfWithPassword(pdfUri: string, password: string) {
  if (!password.trim()) {
    Alert.alert("Senha obrigatória", "Digite uma senha para proteger o PDF.");
    return null;
  }

  const formData = new FormData();

  formData.append("file", {
    uri: pdfUri,
    name: fileName ?? "documento.pdf",
    type: "application/pdf",
  } as any);

  formData.append("password", password);

  const response = await fetch("http://192.168.0.36:3000/pdf/protect", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Erro ao proteger PDF.");
  }

  const data = await response.json();

  return data.uri ?? data.fileUrl;
}
async function processFile() {
  const hasGalleryImages = selectedImages.length > 0;
  const hasSelectedFile = !!fileUri || selectedFiles.length > 0;

  if (type === "premium") {
    Alert.alert(
      "Premium",
      "Aqui você pode conectar sua tela de assinatura, RevenueCat ou compra in-app."
    );
    return;
  }

  if (type === "ocr") {
    await runOCR();
    return;
  }

  if (type !== "image-to-pdf" && !hasSelectedFile) {
    Alert.alert("Selecione um arquivo primeiro.");
    return;
  }

  if (type === "image-to-pdf" && !fileUri && !hasGalleryImages) {
    Alert.alert("Selecione uma imagem primeiro.");
    return;
  }

  try {
    setLoading(true);

    if (type === "protect") {
      if (!fileUri) {
        Alert.alert("Selecione um PDF primeiro.");
        return;
      }

      const protectedUri = await protectPdfWithPassword(fileUri, password);

      if (!protectedUri) return;

      setOutputUri(protectedUri);
      setProcessed(true);

      await saveToHistory({
        id: Date.now().toString(),
        name: `protegido-${fileName ?? "arquivo.pdf"}`,
        uri: protectedUri,
        date: new Date().toISOString(),
        size: fileSize,
      });

      Alert.alert("PDF protegido", "Seu PDF foi protegido com senha.");
      return;
    }

    if (type === "image-to-pdf") {
      const pdfUri = hasGalleryImages
        ? await imagesToPdf(selectedImages)
        : await imageToPdf(fileUri!);

      setOutputUri(pdfUri);
      setProcessed(true);

      await saveToHistory({
        id: Date.now().toString(),
        name: fileName ?? "imagem-para-pdf.pdf",
        uri: pdfUri,
        date: new Date().toISOString(),
      });

      Alert.alert("PDF criado", "Seu PDF foi gerado com sucesso.");
      return;
    }
    
    if (type === "preview") {
      await shareFile();
      setProcessed(true);
      return;
    }

    if (type === "smart-picker") {
      Alert.alert(
        "Ação inteligente",
        "A sugestão já foi exibida. Agora você pode entrar diretamente na ferramenta indicada."
      );
      return;
    }

    if (type === "batch") {
      Alert.alert(
        "Modo lote pronto",
        `${selectedFiles.length || 1} arquivo(s) selecionado(s).\n\nA tela já aceita múltiplos arquivos.`
      );
      return;
    }

    if (type === "compress") {
      const newUri = await fakeCopyPdf("compress");

      if (!newUri) return;

      setOutputUri(newUri);
      setProcessed(true);

      await saveToHistory({
        id: Date.now().toString(),
        name: `comprimido-${fileName ?? "arquivo.pdf"}`,
        uri: newUri,
        date: new Date().toISOString(),
        size: fileSize,
      });

      Alert.alert(
        "Compressão simulada",
        `Fluxo pronto.\n\nPreset: ${selectedPreset}\nArquivo: ${
          fileSize ? formatBytes(fileSize) : "tamanho desconhecido"
        }\n\nPara comprimir de verdade, precisa ligar uma lib nativa de PDF.`
      );

      return;
    }

    const newUri = await fakeCopyPdf(type);

    if (newUri) {
      setOutputUri(newUri);
      setProcessed(true);

      await saveToHistory({
        id: Date.now().toString(),
        name: `${type}-${fileName ?? "arquivo.pdf"}`,
        uri: newUri,
        date: new Date().toISOString(),
        size: fileSize,
      });
    }

    Alert.alert(
      "Ferramenta preparada",
      "Tela pronta. Agora falta conectar a função real de PDF."
    );
  } catch {
    Alert.alert("Erro", "Não foi possível processar o arquivo.");
  } finally {
    setLoading(false);
  }
}

  async function shareFile() {
    const uriToShare = outputUri ?? fileUri;

    if (!uriToShare) return;

    const available = await Sharing.isAvailableAsync();

    if (!available) {
      Alert.alert("Compartilhamento indisponível");
      return;
    }

    await Sharing.shareAsync(uriToShare, {
      mimeType: "application/pdf",
      dialogTitle: "Compartilhar PDF",
      UTI: "com.adobe.pdf",
    });
  }

  function renderExtraFields() {
    if (type === "protect" || type === "unlock") {
      return (
        <View style={styles.extraBox}>
          <Text style={styles.extraLabel}>Senha</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Digite a senha do PDF"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
            style={styles.input}
          />
        </View>
      );
    }

    if (type === "split" || type === "remove-pages" || type === "reorder") {
      return (
        <View style={styles.extraBox}>
          <Text style={styles.extraLabel}>Páginas</Text>
          <TextInput
            value={pageRange}
            onChangeText={setPageRange}
            placeholder="Ex: 1-3, 5, 8"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>
      );
    }

    if (type === "watermark") {
      return (
        <View style={styles.extraBox}>
          <Text style={styles.extraLabel}>Texto da marca d’água</Text>
          <TextInput
            value={watermarkText}
            onChangeText={setWatermarkText}
            placeholder="Ex: CONFIDENCIAL"
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>
      );
    }

    return null;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.privacy}>
        <Lock size={16} color="#34C759" />
        <Text style={styles.privacyText}>
          Processamento local sempre que possível
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconBox}>{icon}</View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {type === "ocr" && (
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>OCR + IA</Text>
            <Text style={styles.tipText}>
              Escolha uma imagem com texto. Primeiro o app extrai o texto, depois
              você pode resumir, explicar ou gerar perguntas com IA.
            </Text>
          </View>
        )}

        {type !== "premium" && (
          <>
            <TouchableOpacity
              style={styles.pickBtn}
              onPress={
                type === "image-to-pdf" || type === "ocr"
                  ? pickImageFromGallery
                  : pickFile
              }
            >
              <Upload size={18} color="#007AFF" />
              <Text style={styles.pickText}>
                {fileName ??
                  (type === "image-to-pdf" || type === "ocr"
                    ? "Escolher da Galeria"
                    : requiresMultiplePdf
                    ? "Selecionar arquivos"
                    : "Selecionar arquivo")}
              </Text>
            </TouchableOpacity>

            {(type === "image-to-pdf" || type === "ocr") && (
              <TouchableOpacity style={styles.secondaryPickBtn} onPress={pickFile}>
                <Text style={styles.secondaryPickText}>
                  Escolher dos Arquivos
                </Text>
              </TouchableOpacity>
            )}

            {fileSize !== null && (
              <Text style={styles.fileSize}>Tamanho: {formatBytes(fileSize)}</Text>
            )}

            {selectedFiles.length > 1 && (
              <Text style={styles.fileSize}>
                {selectedFiles.length} arquivos selecionados
              </Text>
            )}
          </>
        )}
      </View>

      {type === "compress" && (
        <>
          <Text style={styles.section}>Preset</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {presets.map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setSelectedPreset(p)}
                style={[styles.chip, selectedPreset === p && styles.chipActive]}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedPreset === p && styles.chipTextActive,
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {renderExtraFields()}

      {type === "ocr" && ocrText.length > 0 && (
        <View style={styles.extraBox}>
          <Text style={styles.extraLabel}>Texto extraído</Text>
          <Text style={styles.resultText}>{ocrText}</Text>
        </View>
      )}

      {type === "ocr" && ocrText.length > 0 && (
        <View style={styles.steps}>
          <Text style={styles.stepsTitle}>Usar IA</Text>

          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => askAI("summary")}
            disabled={aiLoading}
          >
            <Brain size={18} color="#7C3AED" />
            <Text style={styles.aiBtnText}>Resumir texto</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => askAI("explain")}
            disabled={aiLoading}
          >
            <Brain size={18} color="#7C3AED" />
            <Text style={styles.aiBtnText}>Explicar conteúdo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => askAI("important")}
            disabled={aiLoading}
          >
            <Brain size={18} color="#7C3AED" />
            <Text style={styles.aiBtnText}>Extrair dados importantes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => askAI("questions")}
            disabled={aiLoading}
          >
            <Brain size={18} color="#7C3AED" />
            <Text style={styles.aiBtnText}>Gerar perguntas</Text>
          </TouchableOpacity>

          {aiLoading && <ActivityIndicator color="#7C3AED" />}
        </View>
      )}

      {aiResult.length > 0 && (
        <View style={styles.extraBox}>
          <Text style={styles.extraLabel}>Resultado da IA</Text>
          <Text style={styles.resultText}>{aiResult}</Text>
        </View>
      )}

      {type === "premium" && (
        <View style={styles.premiumBox}>
          <Text style={styles.premiumTitle}>Batch ilimitado</Text>
          <Text style={styles.premiumText}>
            Libere processamento em lote, ferramentas avançadas e uso sem limite
            diário.
          </Text>
        </View>
      )}

      {type !== "premium" && (
        <View style={styles.steps}>
          <Text style={styles.stepsTitle}>3 passos</Text>

          <Step
            label="Selecionar arquivo"
            done={!!fileName || selectedFiles.length > 0}
          />
          <Step label={type === "ocr" ? "Extrair texto" : "Processar"} done={processed} />
          <Step label={type === "ocr" ? "Usar IA" : "Compartilhar"} done={!!aiResult || processed} />
        </View>
      )}

      <TouchableOpacity
        style={[styles.mainBtn, loading && styles.disabledBtn]}
        onPress={processFile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <Zap size={18} color="#FFF" />
            <Text style={styles.mainText}>
              {type === "premium"
                ? "Ver planos"
                : type === "ocr"
                ? "Extrair texto"
                : "Processar"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {(processed || outputUri || fileUri) && type !== "premium" && type !== "ocr" && (
        <TouchableOpacity style={styles.secondary} onPress={shareFile}>
          <Share2 size={18} color="#111827" />
          <Text style={styles.secondaryText}>Compartilhar arquivo</Text>
        </TouchableOpacity>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Step({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.step}>
      <CheckCircle2 size={18} color={done ? "#34C759" : "#9CA3AF"} />
      <Text style={styles.stepText}>{label}</Text>
    </View>
  );
}
