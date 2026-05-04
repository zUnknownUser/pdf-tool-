import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { presentPaywall } from "@/lib/revenuecat";
import { styles } from "../styles/action.styles";
import { postFormDataAndGetFileUrl } from "../utils/apiError";
import i18n from "i18next";

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

import { useLocalSearchParams, router } from "expo-router";
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

// ─── formatBytes usa i18n.t() pois fica fora do componente ───────────────────
function formatBytes(bytes?: number | null) {
  if (!bytes) return i18n.t("action_file_size_unknown");

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const idx = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(2))} ${sizes[idx]}`;
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
  const { t } = useTranslation();

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

  function goToPremium() {
    router.push({ pathname: "/action", params: { type: "premium" } });
  }

  const [password, setPassword] = useState("");
  const [watermarkText, setWatermarkText] = useState("");
  const [pageRange, setPageRange] = useState("");

  const [ocrText, setOcrText] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // ─── título da tela ────────────────────────────────────────────────────────
  const title = useMemo(() => {
    const map: Record<string, string> = {
      compress: t("action_title_compress"),
      "image-to-pdf": t("action_title_image_to_pdf"),
      "pdf-to-word": t("action_title_pdf_to_word"),
      merge: t("action_title_merge"),
      split: t("action_title_split"),
      batch: t("action_title_batch"),
      "smart-picker": t("action_title_smart_picker"),
      rotate: t("action_title_rotate"),
      scan: t("action_title_scan"),
      "remove-pages": t("action_title_remove_pages"),
      protect: t("action_title_protect"),
      unlock: t("action_title_unlock"),
      sign: t("action_title_sign"),
      watermark: t("action_title_watermark"),
      ocr: t("action_title_ocr"),
      preview: t("action_title_preview"),
      premium: t("action_title_premium"),
    };
    return map[type] ?? t("action_title_default");
  }, [type, t]);

  // ─── ícone da ferramenta ───────────────────────────────────────────────────
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

  // ─── subtítulo da tela ─────────────────────────────────────────────────────
  const subtitle = useMemo(() => {
    if (type === "ocr") return t("action_sub_ocr");
    if (type === "smart-picker") return t("action_sub_smart_picker");
    if (type === "batch") return t("action_sub_batch", { limit: BATCH_FREE_LIMIT });
    if (type === "preview") return t("action_sub_preview");
    if (type === "premium") return t("action_sub_premium");
    if (type === "scan") return t("action_sub_scan");
    if (type === "pdf-to-word") return t("action_sub_pdf_to_word");
    return t("action_sub_default");
  }, [type, t]);

  const requiresMultiplePdf =
    type === "merge" || type === "batch" || type === "smart-picker";

  // ─── helpers de arquivo ────────────────────────────────────────────────────
  async function prepareFileForUpload(uri: string, extension = "pdf") {
    const safePath = `${FileSystem.cacheDirectory}upload-${Date.now()}.${extension}`;
    await FileSystem.copyAsync({ from: uri, to: safePath });
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
        setFileName(t("action_files_selected", { count: assets.length }));
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
      showAppError(formatToolError(err, "file-picker"), { onTryAgain: pickFile });
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
          ? t("action_image_selected_one")
          : t("action_images_selected", { count: images.length })
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
        Alert.alert(t("alert_suggest_title"), t("alert_suggest_merge"));
        return;
      }
    }

    const first = files[0];
    const name = String(first?.name ?? "").toLowerCase();
    const mime = String(first?.mimeType ?? "").toLowerCase();

    if (
      mime.includes("image") ||
      name.endsWith(".jpg") ||
      name.endsWith(".png")
    ) {
      Alert.alert(t("alert_suggest_title"), t("alert_suggest_image"));
      return;
    }

    if (first?.size && first.size > 10 * 1024 * 1024) {
      Alert.alert(t("alert_suggest_title"), t("alert_suggest_compress"));
      return;
    }

    Alert.alert(t("alert_suggest_title"), t("alert_suggest_generic"));
  }

  // ─── OCR ──────────────────────────────────────────────────────────────────
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
      showAppError(getFreeLimitError("ocr"), { onGoPremium: goToPremium });
      return;
    }

    try {
      setLoading(true);
      setAiResult("");

      const result = await TextRecognition.recognize(fileUri);
      const text = result?.text?.trim() ?? "";

      if (!text) {
        showAppError(
          getFriendlyError(
            new Error("Nenhum texto encontrado"),
            "ocr",
            "OCR_NO_TEXT_FOUND"
          ),
          { onPickImage: pickImageFromGallery }
        );
        return;
      }

      setOcrText(text);
      setProcessed(true);
      await incrementLimit("ocr");

      Alert.alert(t("alert_ocr_title"), t("alert_ocr_message"));
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

  // ─── IA ───────────────────────────────────────────────────────────────────
  async function askAI(
    action: "summary" | "important" | "questions" | "explain"
  ) {
    if (!ocrText) {
      showAppError(
        getFriendlyError(new Error("Texto vazio"), "ai", "AI_EMPTY_TEXT")
      );
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
      setAiResult(data.result ?? t("action_ocr_no_result"));
    } catch (err) {
      console.error("Erro askAI:", err);
      showAppError(formatToolError(err, "ai"), {
        onTryAgain: () => askAI(action),
      });
    } finally {
      setAiLoading(false);
    }
  }

  // ─── imagem → PDF ──────────────────────────────────────────────────────────
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
      showAppError(getNoFileError(type as any), { onPickFile: pickFile });
      return null;
    }

    const safeName = `${actionName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`;
    const newUri = `${FileSystem.documentDirectory}${safeName}`;
    await FileSystem.copyAsync({ from: fileUri, to: newUri });
    return newUri;
  }

  // ─── proteger / desbloquear ───────────────────────────────────────────────
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

  // ─── marca d'água ─────────────────────────────────────────────────────────
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

  // ─── assinatura ───────────────────────────────────────────────────────────
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
        showAppError(getNoFileError("sign"), { onPickFile: pickFile });
        return;
      }

      const signedUri = await signPdfWithSignature(fileUri, savedUri);
      setOutputUri(signedUri);
      setProcessed(true);

      await saveToHistory({
        id: Date.now().toString(),
        name: `assinado-${fileName ?? "arquivo.pdf"}`,
        uri: signedUri,
        date: new Date().toISOString(),
        size: fileSize,
      });

      Alert.alert(t("alert_sign_title"), t("alert_sign_message"));
    } catch (error) {
      console.error("Erro ao finalizar assinatura:", error);
      showAppError(formatToolError(error, "sign"), {
        onTryAgain: () => setShowSignaturePad(true),
        onPickFile: pickFile,
      });
    } finally {
      setLoading(false);
    }
  }

  // ─── processamento principal ───────────────────────────────────────────────
  async function processFile() {
    const hasGalleryImages = selectedImages.length > 0;
    const hasSelectedFile = !!fileUri || selectedFiles.length > 0;

    // Premium
    if (type === "premium") {
      try {
        setLoading(true);
        const success = await presentPaywall();
        if (success) {
          Alert.alert(t("alert_premium_title"), t("alert_premium_message"));
        }
      } catch (error) {
        console.log("Erro ao abrir paywall:", error);
        showAppError(formatToolError(error, "premium"), { onTryAgain: processFile });
      } finally {
        setLoading(false);
      }
      return;
    }

    if (type === "ocr") { await runOCR(); return; }
    if (type === "preview") { await shareFile(); return; }

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

    // Batch
    if (type === "batch") {
      const isPremium = await checkPremium();
      const count = selectedFiles.length || 1;
      if (!isPremium && count > BATCH_FREE_LIMIT) {
        showAppError(
          getFriendlyError(new Error("Muitos arquivos"), "batch", "TOO_MANY_FILES"),
          { onGoPremium: goToPremium }
        );
        return;
      }
      Alert.alert(
        t("alert_batch_title"),
        t("alert_batch_message", { count })
      );
      return;
    }

    // Smart picker
    if (type === "smart-picker") {
      Alert.alert(t("alert_smart_picker_title"), t("alert_smart_picker_message"));
      return;
    }

    try {
      setLoading(true);

      // Proteger
      if (type === "protect") {
        if (!fileUri) {
          showAppError(getNoFileError("protect"), { onPickFile: pickFile });
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
        Alert.alert(t("alert_protect_title"), t("alert_protect_message"));
        return;
      }

      // Marca d'água
      if (type === "watermark") {
        if (!fileUri) {
          showAppError(getNoFileError("watermark"), { onPickFile: pickFile });
          return;
        }
        const newUri = await addWatermark(fileUri, watermarkText.trim());
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
        Alert.alert(t("alert_watermark_title"));
        return;
      }

      // Desbloquear
      if (type === "unlock") {
        if (!fileUri) {
          showAppError(getNoFileError("unlock"), { onPickFile: pickFile });
          return;
        }
        const unlockedUri = await unlockPdfWithPassword(fileUri, password);
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
        Alert.alert(t("alert_unlock_title"), t("alert_unlock_message"));
        return;
      }

      // Assinar
      if (type === "sign") {
        if (!fileUri) {
          showAppError(getNoFileError("sign"), { onPickFile: pickFile });
          return;
        }

        const pdfUri = fileUri;
        const saved = await AsyncStorage.getItem(SAVED_SIGNATURE_KEY);

        if (saved) {
          setLoading(false);
          Alert.alert(
            t("action_sign_found_title"),
            t("action_sign_found_message"),
            [
              {
                text: t("action_sign_use_saved"),
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

                    Alert.alert(t("alert_sign_title"), t("alert_sign_saved_message"));
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

                          Alert.alert(t("alert_sign_title"), t("alert_sign_saved_message"));
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
                text: t("action_sign_new"),
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

      // Imagem → PDF
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
        Alert.alert(t("alert_image_to_pdf_title"), t("alert_image_to_pdf_message"));
        return;
      }

      // Comprimir
      if (type === "compress") {
        const allowed = await checkLimit("compress");
        if (!allowed) {
          showAppError(getFreeLimitError("compress"), { onGoPremium: goToPremium });
          return;
        }
        if (!fileUri) {
          showAppError(getNoFileError("compress"), { onPickFile: pickFile });
          return;
        }

        const safeUri = await prepareFileForUpload(fileUri, "pdf");
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
        Alert.alert(t("alert_compress_title"), t("alert_compress_message"));
        await incrementLimit("compress");
        return;
      }

      // Escanear
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
        Alert.alert(t("alert_scan_title"), t("alert_scan_message"));
        return;
      }

      // Juntar
      if (type === "merge") {
        if (selectedFiles.length < 2) {
          showAppError(
            getFriendlyError(
              new Error("Selecione pelo menos 2 PDFs"),
              "merge",
              "MIN_FILES_REQUIRED"
            ),
            { onPickFile: pickFile }
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
        Alert.alert(t("alert_merge_title"), t("alert_merge_message"));
        return;
      }

      // Dividir
      if (type === "split") {
        if (!fileUri) {
          showAppError(getNoFileError("split"), { onPickFile: pickFile });
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

        const safeUri = await prepareFileForUpload(fileUri, "pdf");
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
        Alert.alert(t("alert_split_title"), t("alert_split_message"));
        return;
      }

      // PDF → Word
      if (type === "pdf-to-word") {
        const isPremium = await checkPremium();
        if (!isPremium) {
          showAppError(getPremiumRequiredError("pdf-to-word"), {
            onGoPremium: goToPremium,
          });
          return;
        }
        if (!fileUri) {
          showAppError(getNoFileError("pdf-to-word"), { onPickFile: pickFile });
          return;
        }

        const safeUri = await prepareFileForUpload(fileUri, "pdf");
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
        Alert.alert(t("alert_pdf_to_word_title"), t("alert_pdf_to_word_message"));
        return;
      }

      // Rotacionar
      if (type === "rotate") {
        if (!fileUri) {
          showAppError(getNoFileError("rotate"), { onPickFile: pickFile });
          return;
        }

        const safeUri = await prepareFileForUpload(fileUri, "pdf");
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
        Alert.alert(t("alert_rotate_title"), t("alert_rotate_message"));
        return;
      }

      // Remover páginas
      if (type === "remove-pages") {
        if (!fileUri) {
          showAppError(getNoFileError("remove-pages"), { onPickFile: pickFile });
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

        const safeUri = await prepareFileForUpload(fileUri, "pdf");
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
        Alert.alert(t("alert_remove_pages_title"), t("alert_remove_pages_message"));
        return;
      }

      // Fallback genérico
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
      Alert.alert(t("alert_tool_ready"));
    } catch (error) {
      console.error("Erro processFile:", error);
      showAppError(formatToolError(error, type as any), {
        onPickFile: pickFile,
        onPickImage: pickImageFromGallery,
        onTryAgain: processFile,
        onGoPremium: goToPremium,
      });
    } finally {
      setLoading(false);
    }
  }

  // ─── compartilhar ──────────────────────────────────────────────────────────
  async function shareFile() {
    try {
      const uriToShare = outputUri ?? fileUri;
      if (!uriToShare) {
        showAppError(getNoFileError("share"), { onPickFile: pickFile });
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
        dialogTitle: t("alert_share_title"),
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Erro shareFile:", error);
      showAppError(formatToolError(error, "share"), { onTryAgain: shareFile });
    }
  }

  // ─── campos extras (senha / páginas / watermark) ───────────────────────────
  function renderExtraFields() {
    if (type === "protect" || type === "unlock") {
      return (
        <View style={styles.extraBox}>
          <Text style={styles.extraLabel}>{t("action_label_password")}</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder={t("action_placeholder_password")}
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
          <Text style={styles.extraLabel}>{t("action_label_pages")}</Text>
          <TextInput
            value={pageRange}
            onChangeText={setPageRange}
            placeholder={t("action_placeholder_pages")}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>
      );
    }

    if (type === "watermark") {
      return (
        <View style={styles.extraBox}>
          <Text style={styles.extraLabel}>{t("action_label_watermark_text")}</Text>
          <TextInput
            value={watermarkText}
            onChangeText={setWatermarkText}
            placeholder={t("action_placeholder_watermark")}
            placeholderTextColor="#9CA3AF"
            style={styles.input}
          />
        </View>
      );
    }

    return null;
  }

  // ─── tela de assinatura ────────────────────────────────────────────────────
  if (showSignaturePad) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff" }}>
        <View style={{ padding: 16, paddingTop: 50 }}>
          <Text style={{ fontSize: 20, fontWeight: "700", textAlign: "center" }}>
            {t("action_sign_screen_title")}
          </Text>
          <Text style={{ marginTop: 8, color: "#6B7280", textAlign: "center" }}>
            {t("action_sign_screen_subtitle")}
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
            descriptionText={t("action_sign_description")}
            clearText={t("action_sign_clear")}
            confirmText={t("action_sign_save")}
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
            {t("action_sign_cancel")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ─── tela principal ────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Barra de privacidade */}
      <View style={styles.privacy}>
        <Lock size={16} color="#34C759" />
        <Text style={styles.privacyText}>{t("action_privacy_text")}</Text>
      </View>

      {/* Card principal */}
      <View style={styles.card}>
        <View style={styles.iconBox}>{icon}</View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {type === "ocr" && (
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>{t("action_ocr_how_title")}</Text>
            <Text style={styles.tipText}>{t("action_ocr_how_text")}</Text>
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
                    ? t("action_pick_gallery")
                    : requiresMultiplePdf
                    ? t("action_pick_multiple")
                    : t("action_pick_single"))}
              </Text>
            </TouchableOpacity>

            {(type === "image-to-pdf" || type === "ocr") && (
              <TouchableOpacity
                style={styles.secondaryPickBtn}
                onPress={pickFile}
              >
                <Text style={styles.secondaryPickText}>
                  {t("action_pick_files")}
                </Text>
              </TouchableOpacity>
            )}

            {fileSize !== null && (
              <Text style={styles.fileSize}>
                {t("action_file_size", { size: formatBytes(fileSize) })}
              </Text>
            )}

            {selectedFiles.length > 1 && (
              <Text style={styles.fileSize}>
                {t("action_files_selected", { count: selectedFiles.length })}
              </Text>
            )}
          </>
        )}
      </View>

      {/* Presets de compressão */}
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

      {/* Texto extraído pelo OCR */}
      {type === "ocr" && ocrText.length > 0 && (
        <View style={styles.extraBox}>
          <Text style={styles.extraLabel}>{t("action_ocr_extracted")}</Text>
          <Text style={styles.resultText}>{ocrText}</Text>
        </View>
      )}

      {/* Botões de IA */}
      {type === "ocr" && ocrText.length > 0 && (
        <View style={styles.steps}>
          <Text style={styles.stepsTitle}>{t("action_ocr_use_ai")}</Text>

          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => askAI("summary")}
            disabled={aiLoading}
          >
            <Brain size={18} color="#7C3AED" />
            <Text style={styles.aiBtnText}>{t("action_ocr_summarize")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => askAI("explain")}
            disabled={aiLoading}
          >
            <Brain size={18} color="#7C3AED" />
            <Text style={styles.aiBtnText}>{t("action_ocr_explain")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => askAI("important")}
            disabled={aiLoading}
          >
            <Brain size={18} color="#7C3AED" />
            <Text style={styles.aiBtnText}>{t("action_ocr_important")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => askAI("questions")}
            disabled={aiLoading}
          >
            <Brain size={18} color="#7C3AED" />
            <Text style={styles.aiBtnText}>{t("action_ocr_questions")}</Text>
          </TouchableOpacity>

          {aiLoading && <ActivityIndicator color="#7C3AED" />}
        </View>
      )}

      {/* Resultado da IA */}
      {aiResult.length > 0 && (
        <View style={styles.extraBox}>
          <Text style={styles.extraLabel}>{t("action_ocr_ai_result")}</Text>
          <Text style={styles.resultText}>{aiResult}</Text>
        </View>
      )}

      {/* Box premium */}
      {type === "premium" && (
        <View style={styles.premiumBox}>
          <Text style={styles.premiumTitle}>
            {t("action_premium_feature_title")}
          </Text>
          <Text style={styles.premiumText}>
            {t("action_premium_feature_text")}
          </Text>
        </View>
      )}

      {/* Steps */}
      {type !== "premium" && (
        <View style={styles.steps}>
          <Text style={styles.stepsTitle}>{t("action_steps_title")}</Text>
          <Step
            label={t("action_step_select")}
            done={!!fileName || selectedFiles.length > 0}
          />
          <Step
            label={type === "ocr" ? t("action_step_extract") : t("action_step_process")}
            done={processed}
          />
          <Step
            label={type === "ocr" ? t("action_step_use_ai") : t("action_step_share")}
            done={!!aiResult || processed}
          />
        </View>
      )}

      {/* Botão principal */}
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
                ? t("action_btn_plans")
                : type === "ocr"
                ? t("action_btn_extract_text")
                : t("action_btn_process")}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Botão compartilhar */}
      {(processed || outputUri || fileUri) &&
        type !== "premium" &&
        type !== "ocr" &&
        type !== "preview" && (
          <TouchableOpacity style={styles.secondary} onPress={shareFile}>
            <Share2 size={18} color="#111827" />
            <Text style={styles.secondaryText}>{t("action_btn_share")}</Text>
          </TouchableOpacity>
        )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Step ──────────────────────────────────────────────────────────────────────
function Step({ label, done }: { label: string; done: boolean }) {
  return (
    <View style={styles.step}>
      <CheckCircle2 size={18} color={done ? "#34C759" : "#9CA3AF"} />
      <Text style={styles.stepText}>{label}</Text>
    </View>
  );
}