import { useMemo, useState } from "react";
import { presentPaywall } from "@/lib/revenuecat";
import { styles } from "../styles/action.styles";
import { postFormDataAndGetFileUrl } from "../utils/apiError";

import {
  formatToolError,
  getFreeLimitError,
  getFriendlyError,
  getNoFileError,
  getPremiumRequiredError,
} from "../utils/appErrors";

import { showAppError } from "../utils/showAppError";

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from "react-native";

import { useLocalSearchParams } from "expo-router";
import { saveToHistory } from "../utils/history";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SignatureScreen from "react-native-signature-canvas";

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
  Camera,
  Trash2,
  Unlock,
  PenLine,
  Droplets,
  ScanText,
  Files,
  Sparkles,
  Eye,
  FileText,
  Crown,
  Brain,
} from "lucide-react-native";

const FREE_LIMITS_KEY = "PDF_FREE_LIMITS";
const BATCH_FREE_LIMIT = 3;
const SAVED_SIGNATURE_KEY = "PDF_SAVED_SIGNATURE_URI";

const presets = [
  "WhatsApp 16MB",
  "Email 10MB",
  "Concurso 2MB",
  "Receita 3MB",
  "LinkedIn 5MB",
];

const presetToLevel: Record<string, string> = {
  "WhatsApp 16MB": "low",
  "Email 10MB": "recommended",
  "Concurso 2MB": "extreme",
  "Receita 3MB": "extreme",
  "LinkedIn 5MB": "recommended",
};

const titles: Record<string, string> = {
  compress: "Comprimir PDF",
  "image-to-pdf": "Imagem para PDF",
  "pdf-to-word": "PDF para Word",
  merge: "Juntar PDFs",
  split: "Dividir PDF",
  batch: "Modo lote",
  "smart-picker": "Ação inteligente",
  rotate: "Rotacionar PDF",
  scan: "Escanear PDF",
  "remove-pages": "Remover páginas",
  protect: "Proteger PDF",
  unlock: "Desbloquear PDF",
  sign: "Assinar PDF",
  watermark: "Marca d'água",
  ocr: "Ler texto da foto",
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

async function getLimits() {
  const raw = await AsyncStorage.getItem(FREE_LIMITS_KEY);
  const today = new Date().toDateString();

  const defaults = {
    compress: { date: today, used: 0, limit: 3 },
    ocr: { date: today, used: 0, limit: 2 },
  };

  if (!raw) return defaults;

  const parsed = JSON.parse(raw);

  return {
    compress:
      parsed.compress?.date === today
        ? parsed.compress
        : { date: today, used: 0, limit: 3 },
    ocr:
      parsed.ocr?.date === today
        ? parsed.ocr
        : { date: today, used: 0, limit: 2 },
  };
}

async function incrementLimit(key: "compress" | "ocr") {
  const limits = await getLimits();
  limits[key].used += 1;
  await AsyncStorage.setItem(FREE_LIMITS_KEY, JSON.stringify(limits));
}

async function checkLimit(key: "compress" | "ocr"): Promise<boolean> {
  const limits = await getLimits();
  return limits[key].used < limits[key].limit;
}

async function checkPremium(): Promise<boolean> {
  const { isPremiumUser } = await import("@/lib/revenuecat");
  return isPremiumUser();
}

export default function ActionScreen() {
  const params = useLocalSearchParams<{
    type: string;
    uri?: string;
    name?: string;
  }>();

  const type = params.type ?? "compress";

  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [signatureUri, setSignatureUri] = useState<string | null>(null);

  const [selectedPreset, setSelectedPreset] = useState(presets[0]);
  const [fileName, setFileName] = useState<string | null>(params.name ?? null);
  const [fileUri, setFileUri] = useState<string | null>(params.uri ?? null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<any[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [outputUri, setOutputUri] = useState<string | null>(params.uri ?? null);
  const [processed, setProcessed] = useState(!!params.uri);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = "https://pdf-tool-production-4307.up.railway.app";
  const AI_API_URL = `${API_BASE_URL}/ai/pdf-tools`;

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
    if (type === "pdf-to-word") return <FileText size={26} color="#007AFF" />;
    if (type === "split") return <Scissors size={26} color="#007AFF" />;
    if (type === "batch") return <Files size={26} color="#007AFF" />;
    if (type === "smart-picker") return <Sparkles size={26} color="#7C3AED" />;
    if (type === "rotate") return <RotateCw size={26} color="#007AFF" />;
    if (type === "scan") return <Camera size={26} color="#007AFF" />;
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

    if (type === "smart-picker") return "Selecione um arquivo e o app sugere a melhor ação.";
    if (type === "batch") return `Selecione até ${BATCH_FREE_LIMIT} arquivos no plano grátis.`;
    if (type === "preview") return "Abra, confira e compartilhe seu PDF.";
    if (type === "premium") return "Libere processamento ilimitado e ferramentas avançadas.";
    if (type === "scan") return "Fotografe um documento e converta para PDF.";
    if (type === "pdf-to-word") return "Converta seu PDF em documento Word editável.";

    return "Escolha o arquivo e processe em segundos.";
  }, [type]);

  const requiresMultiplePdf =
    type === "merge" || type === "batch" || type === "smart-picker";

  async function prepareFileForUpload(uri: string, extension = "pdf") {
    const safePath = `${FileSystem.cacheDirectory}upload-${Date.now()}.${extension}`;

    await FileSystem.copyAsync({
      from: uri,
      to: safePath,
    });

    return safePath;
  }

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
    } catch (err) {
      console.error("Erro pickFile:", err);

      showAppError(formatToolError(err, "file-picker"), {
        onTryAgain: pickFile,
      });
    }
  }

  async function pickImageFromGallery() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        showAppError(
          getFriendlyError(
            new Error("Permissão da galeria negada"),
            "gallery",
            "GALLERY_PERMISSION_DENIED"
          )
        );
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
    } catch (err) {
      console.error("Erro pickImageFromGallery:", err);

      showAppError(formatToolError(err, "gallery"), {
        onTryAgain: pickImageFromGallery,
      });
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
      showAppError(getNoFileError("ocr"), {
        onPickImage: pickImageFromGallery,
        onPickFile: pickFile,
      });
      return;
    }

    const allowed = await checkLimit("ocr");

    if (!allowed) {
      showAppError(getFreeLimitError("ocr"), {
        onGoPremium: async () => {
          await presentPaywall();
        },
      });
      return;
    }

    try {
      setLoading(true);
      setAiResult("");

      const result = await TextRecognition.recognize(fileUri);
      const text = result?.text?.trim() ?? "";

      if (!text) {
        showAppError(getFriendlyError(new Error("Nenhum texto encontrado"), "ocr", "OCR_NO_TEXT_FOUND"), {
          onPickImage: pickImageFromGallery,
        });
        return;
      }

      setOcrText(text);
      setProcessed(true);

      await incrementLimit("ocr");

      Alert.alert("OCR concluído", "Texto extraído com sucesso.");
    } catch (err) {
      console.error("Erro OCR:", err);

      showAppError(formatToolError(err, "ocr"), {
        onTryAgain: runOCR,
        onPickImage: pickImageFromGallery,
      });
    } finally {
      setLoading(false);
    }
  }

  async function askAI(action: "summary" | "important" | "questions" | "explain") {
    if (!ocrText) {
      showAppError(getFriendlyError(new Error("Texto vazio"), "ai", "AI_EMPTY_TEXT"));
      return;
    }

    try {
      setAiLoading(true);

      const response = await fetch(AI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, text: ocrText }),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || `Status ${response.status}`);
      }

      const data = await response.json();
      setAiResult(data.result ?? "A IA não retornou resultado.");
    } catch (err) {
      console.error("Erro askAI:", err);

      showAppError(formatToolError(err, "ai"), {
        onTryAgain: () => askAI(action),
      });
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
              width: 100%; height: 100vh;
              display: flex; align-items: center; justify-content: center;
              padding: 24px; box-sizing: border-box; page-break-after: always;
            }
            img { max-width: 100%; max-height: 100%; object-fit: contain; }
          </style>
        </head>
        <body>${htmlImages}</body>
      </html>
    `;

    const pdf = await Print.printToFileAsync({ html, base64: false });
    const newFileName = `pdftoolkit-${Date.now()}.pdf`;
    const newUri = `${FileSystem.documentDirectory}${newFileName}`;

    await FileSystem.copyAsync({ from: pdf.uri, to: newUri });

    return newUri;
  }

  async function imageToPdf(imageUri: string) {
    return imagesToPdf([{ uri: imageUri }]);
  }

  async function fakeCopyPdf(actionName: string) {
    if (!fileUri) {
      showAppError(getNoFileError(type as any), {
        onPickFile: pickFile,
      });
      return null;
    }

    const safeName = `${actionName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`;
    const newUri = `${FileSystem.documentDirectory}${safeName}`;

    await FileSystem.copyAsync({ from: fileUri, to: newUri });

    return newUri;
  }

  async function protectPdfWithPassword(pdfUri: string, pwd: string) {
    if (!pwd.trim()) {
      showAppError(
        getFriendlyError(
          new Error("Senha obrigatória"),
          "protect",
          "PASSWORD_REQUIRED"
        )
      );
      return null;
    }

    const safeUri = await prepareFileForUpload(pdfUri, "pdf");

    const formData = new FormData();
    formData.append("file", {
      uri: safeUri,
      name: fileName ?? "documento.pdf",
      type: "application/pdf",
    } as any);
    formData.append("password", pwd);

    const fileUrl = await postFormDataAndGetFileUrl(
      `${API_BASE_URL}/pdf/protect`,
      formData
    );

    const localUri = `${FileSystem.documentDirectory}protected-${Date.now()}.pdf`;
    const downloaded = await FileSystem.downloadAsync(fileUrl, localUri);

    return downloaded.uri;
  }

  async function unlockPdfWithPassword(pdfUri: string, pwd: string) {
    if (!pwd.trim()) {
      showAppError(
        getFriendlyError(
          new Error("Senha obrigatória"),
          "unlock",
          "PASSWORD_REQUIRED"
        )
      );
      return null;
    }

    const safeUri = await prepareFileForUpload(pdfUri, "pdf");

    const formData = new FormData();
    formData.append("file", {
      uri: safeUri,
      name: fileName ?? "documento.pdf",
      type: "application/pdf",
    } as any);
    formData.append("password", pwd);

    const fileUrl = await postFormDataAndGetFileUrl(
      `${API_BASE_URL}/pdf/unlock`,
      formData
    );

    const localUri = `${FileSystem.documentDirectory}unlocked-${Date.now()}.pdf`;
    const downloaded = await FileSystem.downloadAsync(fileUrl, localUri);

    return downloaded.uri;
  }

  async function addWatermark(pdfUri: string, text: string) {
    if (!text.trim()) {
      showAppError(
        getFriendlyError(
          new Error("Texto da marca d'água obrigatório"),
          "watermark",
          "WATERMARK_TEXT_REQUIRED"
        )
      );
      return null;
    }

    const safeUri = await prepareFileForUpload(pdfUri, "pdf");

    const formData = new FormData();
    formData.append("file", {
      uri: safeUri,
      name: fileName ?? "documento.pdf",
      type: "application/pdf",
    } as any);
    formData.append("text", text.trim());

    const fileUrl = await postFormDataAndGetFileUrl(
      `${API_BASE_URL}/pdf/watermark`,
      formData
    );

    const localUri = `${FileSystem.documentDirectory}watermark-${Date.now()}.pdf`;
    const downloaded = await FileSystem.downloadAsync(fileUrl, localUri);

    return downloaded.uri;
  }

  async function saveSignatureToFile(signatureBase64: string) {
    const cleanBase64 = signatureBase64.replace("data:image/png;base64,", "");
    const path = `${FileSystem.cacheDirectory}signature-${Date.now()}.png`;

    await FileSystem.writeAsStringAsync(path, cleanBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return path;
  }

  async function signPdfWithSignature(pdfUri: string, signUri: string) {
    const safePdfUri = await prepareFileForUpload(pdfUri, "pdf");
    const safeSignUri = await prepareFileForUpload(signUri, "png");

    const formData = new FormData();
    formData.append("file", {
      uri: safePdfUri,
      name: fileName ?? "documento.pdf",
      type: "application/pdf",
    } as any);

    formData.append("signature", {
      uri: safeSignUri,
      name: "signature.png",
      type: "image/png",
    } as any);

    formData.append("page", "1");
    formData.append("x", "350");
    formData.append("y", "80");
    formData.append("width", "160");
    formData.append("height", "70");

    const fileUrl = await postFormDataAndGetFileUrl(
      `${API_BASE_URL}/pdf/sign`,
      formData
    );

    const localUri = `${FileSystem.documentDirectory}signed-${Date.now()}.pdf`;
    const downloaded = await FileSystem.downloadAsync(fileUrl, localUri);

    return downloaded.uri;
  }

  async function handleSignatureOK(signatureBase64: string) {
    try {
      const savedUri = await saveSignatureToFile(signatureBase64);

      setSignatureUri(savedUri);
      await AsyncStorage.setItem(SAVED_SIGNATURE_KEY, savedUri);

      setShowSignaturePad(false);
      setLoading(true);

      if (!fileUri) {
        showAppError(getNoFileError("sign"), {
          onPickFile: pickFile,
        });
        return;
      }

      const pdfUri = fileUri;
      const signedUri = await signPdfWithSignature(pdfUri, savedUri);

      setOutputUri(signedUri);
      setProcessed(true);

      await saveToHistory({
        id: Date.now().toString(),
        name: `assinado-${fileName ?? "arquivo.pdf"}`,
        uri: signedUri,
        date: new Date().toISOString(),
        size: fileSize,
      });

      Alert.alert("PDF assinado", "Sua assinatura foi salva e aplicada ao PDF.");
    } catch (error) {
      console.error("Erro ao finalizar assinatura:", error);

      showAppError(formatToolError(error, "sign"), {
        onTryAgain: () => {
          setShowSignaturePad(true);
        },
        onPickFile: pickFile,
      });
    } finally {
      setLoading(false);
    }
  }

  async function processFile() {
    const hasGalleryImages = selectedImages.length > 0;
    const hasSelectedFile = !!fileUri || selectedFiles.length > 0;

    if (type === "premium") {
      try {
        setLoading(true);

        const success = await presentPaywall();

        if (success) {
          Alert.alert("Premium ativado", "Seu acesso Premium foi liberado.");
        }
      } catch (error) {
        console.log("Erro ao abrir paywall:", error);

        showAppError(formatToolError(error, "premium"), {
          onTryAgain: processFile,
        });
      } finally {
        setLoading(false);
      }

      return;
    }

    if (type === "ocr") {
      await runOCR();
      return;
    }

    if (type === "preview") {
      await shareFile();
      return;
    }

    if (type !== "image-to-pdf" && type !== "scan" && !hasSelectedFile) {
      showAppError(getNoFileError(type as any), {
        onPickFile: pickFile,
        onPickImage: pickImageFromGallery,
      });
      return;
    }

    if (type === "image-to-pdf" && !fileUri && !hasGalleryImages) {
      showAppError(getNoFileError("image-to-pdf"), {
        onPickFile: pickFile,
        onPickImage: pickImageFromGallery,
      });
      return;
    }

    if (type === "batch") {
      const isPremium = await checkPremium();
      const count = selectedFiles.length || 1;

      if (!isPremium && count > BATCH_FREE_LIMIT) {
        showAppError(getFriendlyError(new Error("Muitos arquivos"), "batch", "TOO_MANY_FILES"), {
          onGoPremium: async () => {
            await presentPaywall();
          },
        });
        return;
      }

      Alert.alert("Modo lote pronto", `${count} arquivo(s) selecionado(s).`);
      return;
    }

    if (type === "smart-picker") {
      Alert.alert("Ação inteligente", "Sugestão já exibida.");
      return;
    }

    try {
      setLoading(true);

      if (type === "protect") {
        if (!fileUri) {
          showAppError(getNoFileError("protect"), {
            onPickFile: pickFile,
          });
          return;
        }

        const pdfUri = fileUri;
        const protectedUri = await protectPdfWithPassword(pdfUri, password);

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

      if (type === "watermark") {
        if (!fileUri) {
          showAppError(getNoFileError("watermark"), {
            onPickFile: pickFile,
          });
          return;
        }

        const pdfUri = fileUri;
        const newUri = await addWatermark(pdfUri, watermarkText.trim());

        if (!newUri) return;

        setOutputUri(newUri);
        setProcessed(true);

        await saveToHistory({
          id: Date.now().toString(),
          name: `marca-dagua-${fileName ?? "arquivo.pdf"}`,
          uri: newUri,
          date: new Date().toISOString(),
          size: fileSize,
        });

        Alert.alert("Marca d'água aplicada");
        return;
      }

      if (type === "unlock") {
        if (!fileUri) {
          showAppError(getNoFileError("unlock"), {
            onPickFile: pickFile,
          });
          return;
        }

        const pdfUri = fileUri;
        const unlockedUri = await unlockPdfWithPassword(pdfUri, password);

        if (!unlockedUri) return;

        setOutputUri(unlockedUri);
        setProcessed(true);

        await saveToHistory({
          id: Date.now().toString(),
          name: `desbloqueado-${fileName ?? "arquivo.pdf"}`,
          uri: unlockedUri,
          date: new Date().toISOString(),
          size: fileSize,
        });

        Alert.alert("PDF desbloqueado", "Seu PDF foi desbloqueado com sucesso.");
        return;
      }

      if (type === "sign") {
        if (!fileUri) {
          showAppError(getNoFileError("sign"), {
            onPickFile: pickFile,
          });
          return;
        }

        const pdfUri = fileUri;
        const saved = await AsyncStorage.getItem(SAVED_SIGNATURE_KEY);

        if (saved) {
          setLoading(false);

          Alert.alert(
            "Assinatura salva encontrada",
            "Deseja usar sua assinatura salva?",
            [
              {
                text: "Usar",
                onPress: async () => {
                  try {
                    setLoading(true);
                    setSignatureUri(saved);

                    const signedUri = await signPdfWithSignature(pdfUri, saved);

                    setOutputUri(signedUri);
                    setProcessed(true);

                    await saveToHistory({
                      id: Date.now().toString(),
                      name: `assinado-${fileName ?? "arquivo.pdf"}`,
                      uri: signedUri,
                      date: new Date().toISOString(),
                      size: fileSize,
                    });

                    Alert.alert("PDF assinado", "Sua assinatura salva foi usada.");
                  } catch (error) {
                    console.error("Erro ao usar assinatura salva:", error);

                    showAppError(formatToolError(error, "sign"), {
                      onTryAgain: async () => {
                        try {
                          setLoading(true);
                          setSignatureUri(saved);

                          const signedUri = await signPdfWithSignature(pdfUri, saved);

                          setOutputUri(signedUri);
                          setProcessed(true);

                          await saveToHistory({
                            id: Date.now().toString(),
                            name: `assinado-${fileName ?? "arquivo.pdf"}`,
                            uri: signedUri,
                            date: new Date().toISOString(),
                            size: fileSize,
                          });

                          Alert.alert("PDF assinado", "Sua assinatura salva foi usada.");
                        } catch (err) {
                          showAppError(formatToolError(err, "sign"));
                        } finally {
                          setLoading(false);
                        }
                      },
                      onPickFile: pickFile,
                    });
                  } finally {
                    setLoading(false);
                  }
                },
              },
              {
                text: "Nova assinatura",
                onPress: () => {
                  setSignatureUri(null);
                  setShowSignaturePad(true);
                },
              },
            ]
          );

          return;
        }

        setLoading(false);
        setShowSignaturePad(true);
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

      if (type === "compress") {
        const allowed = await checkLimit("compress");

        if (!allowed) {
          showAppError(getFreeLimitError("compress"), {
            onGoPremium: async () => {
              await presentPaywall();
            },
          });
          return;
        }

        if (!fileUri) {
          showAppError(getNoFileError("compress"), {
            onPickFile: pickFile,
          });
          return;
        }

        const pdfUri = fileUri;
        const safeUri = await prepareFileForUpload(pdfUri, "pdf");

        const formData = new FormData();
        formData.append("file", {
          uri: safeUri,
          name: fileName ?? "documento.pdf",
          type: "application/pdf",
        } as any);

        formData.append(
          "compression_level",
          presetToLevel[selectedPreset] ?? "recommended"
        );

        const fileUrl = await postFormDataAndGetFileUrl(
          `${API_BASE_URL}/pdf/compress`,
          formData
        );

        const localUri = `${FileSystem.documentDirectory}compressed-${Date.now()}.pdf`;
        const downloaded = await FileSystem.downloadAsync(fileUrl, localUri);

        setOutputUri(downloaded.uri);
        setProcessed(true);

        await saveToHistory({
          id: Date.now().toString(),
          name: `comprimido-${fileName ?? "arquivo.pdf"}`,
          uri: downloaded.uri,
          date: new Date().toISOString(),
          size: fileSize,
        });

        Alert.alert("PDF comprimido", "Seu PDF foi comprimido com sucesso.");
        await incrementLimit("compress");
        return;
      }

      if (type === "scan") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();

        if (!permission.granted) {
          showAppError(
            getFriendlyError(
              new Error("Permissão da câmera negada"),
              "scan",
              "CAMERA_PERMISSION_DENIED"
            )
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({ quality: 1 });

        if (result.canceled) return;

        const pdfUri = await imagesToPdf(result.assets);

        setOutputUri(pdfUri);
        setProcessed(true);

        await saveToHistory({
          id: Date.now().toString(),
          name: `scan-${Date.now()}.pdf`,
          uri: pdfUri,
          date: new Date().toISOString(),
        });

        Alert.alert("PDF criado", "Documento escaneado com sucesso.");
        return;
      }

      if (type === "merge") {
        if (selectedFiles.length < 2) {
          showAppError(
            getFriendlyError(
              new Error("Selecione pelo menos 2 PDFs"),
              "merge",
              "MIN_FILES_REQUIRED"
            ),
            {
              onPickFile: pickFile,
            }
          );
          return;
        }

        const formData = new FormData();

        for (const file of selectedFiles) {
          const safeUri = await prepareFileForUpload(file.uri, "pdf");

          formData.append("files", {
            uri: safeUri,
            name: file.name ?? "documento.pdf",
            type: "application/pdf",
          } as any);
        }

        const fileUrl = await postFormDataAndGetFileUrl(
          `${API_BASE_URL}/pdf/merge`,
          formData
        );

        const localUri = `${FileSystem.documentDirectory}merged-${Date.now()}.pdf`;
        const downloaded = await FileSystem.downloadAsync(fileUrl, localUri);

        setOutputUri(downloaded.uri);
        setProcessed(true);

        await saveToHistory({
          id: Date.now().toString(),
          name: `unido-${Date.now()}.pdf`,
          uri: downloaded.uri,
          date: new Date().toISOString(),
        });

        Alert.alert("PDFs unidos", "Seus arquivos foram unidos com sucesso.");
        return;
      }

      if (type === "split") {
        if (!fileUri) {
          showAppError(getNoFileError("split"), {
            onPickFile: pickFile,
          });
          return;
        }

        if (!pageRange.trim()) {
          showAppError(
            getFriendlyError(
              new Error("Intervalo de páginas vazio"),
              "split",
              "INVALID_PAGE_RANGE"
            )
          );
          return;
        }

        const pdfUri = fileUri;
        const safeUri = await prepareFileForUpload(pdfUri, "pdf");

        const formData = new FormData();
        formData.append("file", {
          uri: safeUri,
          name: fileName ?? "documento.pdf",
          type: "application/pdf",
        } as any);
        formData.append("ranges", pageRange.trim());

        const fileUrl = await postFormDataAndGetFileUrl(
          `${API_BASE_URL}/pdf/split`,
          formData
        );

        const localUri = `${FileSystem.documentDirectory}split-${Date.now()}.zip`;
        const downloaded = await FileSystem.downloadAsync(fileUrl, localUri);

        setOutputUri(downloaded.uri);
        setProcessed(true);

        await saveToHistory({
          id: Date.now().toString(),
          name: `dividido-${Date.now()}.zip`,
          uri: downloaded.uri,
          date: new Date().toISOString(),
        });

        Alert.alert(
          "PDF dividido",
          "Seu PDF foi dividido com sucesso. O resultado é um .zip."
        );
        return;
      }

      if (type === "pdf-to-word") {
        const isPremium = await checkPremium();

        if (!isPremium) {
          showAppError(getPremiumRequiredError("pdf-to-word"), {
            onGoPremium: async () => {
              await presentPaywall();
            },
          });
          return;
        }

        if (!fileUri) {
          showAppError(getNoFileError("pdf-to-word"), {
            onPickFile: pickFile,
          });
          return;
        }

        const pdfUri = fileUri;
        const safeUri = await prepareFileForUpload(pdfUri, "pdf");

        const formData = new FormData();
        formData.append("file", {
          uri: safeUri,
          name: fileName ?? "documento.pdf",
          type: "application/pdf",
        } as any);

        const fileUrl = await postFormDataAndGetFileUrl(
          `${API_BASE_URL}/pdf/pdf-to-word`,
          formData
        );

        const localUri = `${FileSystem.documentDirectory}word-${Date.now()}.docx`;
        const downloaded = await FileSystem.downloadAsync(fileUrl, localUri);

        setOutputUri(downloaded.uri);
        setProcessed(true);

        await saveToHistory({
          id: Date.now().toString(),
          name: `word-${fileName ?? "arquivo.docx"}`,
          uri: downloaded.uri,
          date: new Date().toISOString(),
        });

        Alert.alert("Convertido!", "Seu PDF foi convertido para Word com sucesso.");
        return;
      }

      if (type === "rotate") {
        if (!fileUri) {
          showAppError(getNoFileError("rotate"), {
            onPickFile: pickFile,
          });
          return;
        }

        const pdfUri = fileUri;
        const safeUri = await prepareFileForUpload(pdfUri, "pdf");

        const formData = new FormData();
        formData.append("file", {
          uri: safeUri,
          name: fileName ?? "documento.pdf",
          type: "application/pdf",
        } as any);
        formData.append("rotation", "90");

        const fileUrl = await postFormDataAndGetFileUrl(
          `${API_BASE_URL}/pdf/rotate`,
          formData
        );

        const localUri = `${FileSystem.documentDirectory}rotated-${Date.now()}.pdf`;
        const downloaded = await FileSystem.downloadAsync(fileUrl, localUri);

        setOutputUri(downloaded.uri);
        setProcessed(true);

        await saveToHistory({
          id: Date.now().toString(),
          name: `rotacionado-${fileName ?? "arquivo.pdf"}`,
          uri: downloaded.uri,
          date: new Date().toISOString(),
          size: fileSize,
        });

        Alert.alert("PDF rotacionado", "Seu PDF foi rotacionado com sucesso.");
        return;
      }

      if (type === "remove-pages") {
        if (!fileUri) {
          showAppError(getNoFileError("remove-pages"), {
            onPickFile: pickFile,
          });
          return;
        }

        if (!pageRange.trim()) {
          showAppError(
            getFriendlyError(
              new Error("Intervalo de páginas vazio"),
              "remove-pages",
              "INVALID_PAGE_RANGE"
            )
          );
          return;
        }

        const pdfUri = fileUri;
        const safeUri = await prepareFileForUpload(pdfUri, "pdf");

        const formData = new FormData();
        formData.append("file", {
          uri: safeUri,
          name: fileName ?? "documento.pdf",
          type: "application/pdf",
        } as any);
        formData.append("ranges", pageRange.trim());

        const fileUrl = await postFormDataAndGetFileUrl(
          `${API_BASE_URL}/pdf/remove-pages`,
          formData
        );

        const localUri = `${FileSystem.documentDirectory}removed-${Date.now()}.pdf`;
        const downloaded = await FileSystem.downloadAsync(fileUrl, localUri);

        setOutputUri(downloaded.uri);
        setProcessed(true);

        await saveToHistory({
          id: Date.now().toString(),
          name: `paginas-removidas-${fileName ?? "arquivo.pdf"}`,
          uri: downloaded.uri,
          date: new Date().toISOString(),
          size: fileSize,
        });

        Alert.alert("Páginas removidas", "As páginas foram removidas com sucesso.");
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

      Alert.alert("Ferramenta preparada");
    } catch (error) {
      console.error("Erro processFile:", error);

      showAppError(formatToolError(error, type as any), {
        onPickFile: pickFile,
        onPickImage: pickImageFromGallery,
        onTryAgain: processFile,
        onGoPremium: async () => {
          await presentPaywall();
        },
      });
    } finally {
      setLoading(false);
    }
  }

  async function shareFile() {
    try {
      const uriToShare = outputUri ?? fileUri;

      if (!uriToShare) {
        showAppError(getNoFileError("share"), {
          onPickFile: pickFile,
        });
        return;
      }

      const available = await Sharing.isAvailableAsync();

      if (!available) {
        showAppError(
          getFriendlyError(
            new Error("Compartilhamento indisponível"),
            "share",
            "SHARE_FAILED"
          )
        );
        return;
      }

      await Sharing.shareAsync(uriToShare, {
        mimeType: "application/pdf",
        dialogTitle: "Compartilhar PDF",
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Erro shareFile:", error);

      showAppError(formatToolError(error, "share"), {
        onTryAgain: shareFile,
      });
    }
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

    if (type === "split" || type === "remove-pages") {
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
          <Text style={styles.extraLabel}>Texto da marca d'água</Text>
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

  if (showSignaturePad) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={{ padding: 16, paddingTop: 50 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", textAlign: "center" }}>
            Assinar PDF
          </Text>
          <Text style={{ marginTop: 8, color: "#6B7280", textAlign: "center" }}>
            Desenhe sua assinatura e toque em Salvar
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <SignatureScreen
            onOK={handleSignatureOK}
            onEmpty={() =>
              showAppError(
                getFriendlyError(
                  new Error("Assinatura vazia"),
                  "sign",
                  "SIGNATURE_REQUIRED"
                )
              )
            }
            descriptionText="Assine no espaço abaixo"
            clearText="Limpar"
            confirmText="Salvar"
            webStyle={`
              .m-signature-pad {
                box-shadow: none;
                border: none;
                height: 100%;
              }
              .m-signature-pad--body {
                border: 2px dashed #D1D5DB;
                margin: 0 16px;
                height: calc(100% - 80px);
              }
              .m-signature-pad--footer {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                height: 72px;
              }
              .button {
                background-color: #007AFF;
                color: #ffffff;
                border-radius: 12px;
                padding: 12px 24px;
                font-size: 16px;
                font-weight: 700;
              }
              .button.clear {
                background-color: #E5E7EB;
                color: #111827;
              }
              .description {
                color: #6B7280;
                font-size: 14px;
              }
            `}
          />
        </View>

        <TouchableOpacity
          style={{ padding: 16, marginBottom: 16 }}
          onPress={() => setShowSignaturePad(false)}
        >
          <Text style={{ textAlign: "center", color: "#EF4444", fontWeight: "700" }}>
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.privacy}>
        <Lock size={16} color="#34C759" />
        <Text style={styles.privacyText}>Processamento local sempre que possível</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.iconBox}>{icon}</View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {type === "ocr" && (
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>Como funciona</Text>
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
                <Text style={styles.secondaryPickText}>Escolher dos Arquivos</Text>
              </TouchableOpacity>
            )}

            {fileSize !== null && (
              <Text style={styles.fileSize}>Tamanho: {formatBytes(fileSize)}</Text>
            )}

            {selectedFiles.length > 1 && (
              <Text style={styles.fileSize}>{selectedFiles.length} arquivos selecionados</Text>
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
            Libere processamento em lote, ferramentas avançadas e uso sem limite diário.
          </Text>
        </View>
      )}

      {type !== "premium" && (
        <View style={styles.steps}>
          <Text style={styles.stepsTitle}>3 passos</Text>
          <Step label="Selecionar arquivo" done={!!fileName || selectedFiles.length > 0} />
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
              {type === "premium" ? "Ver planos" : type === "ocr" ? "Extrair texto" : "Processar"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {(processed || outputUri || fileUri) &&
        type !== "premium" &&
        type !== "ocr" &&
        type !== "preview" && (
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