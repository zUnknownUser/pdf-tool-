import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_KEY = "PDF_LANGUAGE";

const resources = {
  "pt-BR": {
    translation: {
      // HOME
      greeting_morning: "Bom dia 👋",
      greeting_afternoon: "Boa tarde 👋",
      greeting_evening: "Boa noite 👋",
      greeting_subtitle: "O que vamos resolver hoje?",
      tip_label: "💡 Dica do dia",
      section_continue: "Continuar",
      section_goal: "O que você quer fazer?",
      section_tools: "Ferramentas",
      section_more_tools: "Mais ferramentas",
      section_recent: "Recentes",
      section_premium: "Premium",
      last_file: "Último arquivo usado",

      // GOALS
      goal_compress: "Reduzir tamanho",
      goal_merge: "Juntar arquivos",
      goal_image: "Converter imagens",
      goal_split: "Separar páginas",

      // TOOLS
      tool_compress: "Comprimir PDF",
      tool_compress_sub: "grátis hoje",
      tool_image_pdf: "Imagem para PDF",
      tool_image_pdf_sub: "Fotos em PDF.",
      tool_pdf_word: "PDF para Word",
      tool_pdf_word_sub: "Converta documentos.",
      tool_merge: "Juntar PDFs",
      tool_merge_sub: "Una arquivos.",
      tool_split: "Dividir PDF",
      tool_split_sub: "Separe páginas.",
      tool_batch: "Modo lote",
      tool_batch_sub: "Vários arquivos.",
      tool_rotate: "Rotacionar",
      tool_rotate_sub: "Gire páginas.",
      tool_scan: "Escanear PDF",
      tool_scan_sub: "Use a câmera.",
      tool_remove: "Remover páginas",
      tool_remove_sub: "Apague páginas.",
      tool_protect: "Proteger PDF",
      tool_protect_sub: "Senha no arquivo.",
      tool_unlock: "Desbloquear",
      tool_unlock_sub: "Remover senha.",
      tool_sign: "Assinar PDF",
      tool_sign_sub: "Adicionar assinatura.",
      tool_watermark: "Marca d'água",
      tool_watermark_sub: "Texto ou imagem.",
      tool_ocr: "Ler texto da foto",
      tool_premium: "Desbloquear tudo",
      tool_premium_sub: "Sem limites diários, batch e sem anúncios.",

      // SETTINGS
      settings_plan_free: "Plano Grátis",
      settings_plan_premium: "Plano Premium",
      settings_plan_free_sub: "Alguns recursos são limitados",
      settings_plan_premium_sub: "Uso ilimitado ativo ✓",
      settings_upgrade: "Ver planos",
      settings_usage_today: "Uso de hoje",
      settings_compressions: "Compressões",
      settings_ocr: "Leitura de texto",
      settings_preferences: "Preferências",
      settings_theme: "Tema",
      settings_language: "Idioma",
      settings_coming_soon: "Em breve",
      settings_data: "Dados",
      settings_clear_history: "Limpar histórico",
      settings_clear_cache: "Limpar cache",
      settings_about: "Sobre o app",
      settings_rate: "Avaliar o app",
      settings_privacy: "Política de privacidade",
      settings_terms: "Termos de uso",
      settings_version: "Versão 1.0.0",
    },
  },
  en: {
    translation: {
      // HOME
      greeting_morning: "Good morning 👋",
      greeting_afternoon: "Good afternoon 👋",
      greeting_evening: "Good evening 👋",
      greeting_subtitle: "What are we solving today?",
      tip_label: "💡 Tip of the day",
      section_continue: "Continue",
      section_goal: "What do you want to do?",
      section_tools: "Tools",
      section_more_tools: "More tools",
      section_recent: "Recent",
      section_premium: "Premium",
      last_file: "Last file used",

      // GOALS
      goal_compress: "Reduce size",
      goal_merge: "Merge files",
      goal_image: "Convert images",
      goal_split: "Split pages",

      // TOOLS
      tool_compress: "Compress PDF",
      tool_compress_sub: "free today",
      tool_image_pdf: "Image to PDF",
      tool_image_pdf_sub: "Photos to PDF.",
      tool_pdf_word: "PDF to Word",
      tool_pdf_word_sub: "Convert documents.",
      tool_merge: "Merge PDFs",
      tool_merge_sub: "Join files.",
      tool_split: "Split PDF",
      tool_split_sub: "Separate pages.",
      tool_batch: "Batch mode",
      tool_batch_sub: "Multiple files.",
      tool_rotate: "Rotate",
      tool_rotate_sub: "Rotate pages.",
      tool_scan: "Scan PDF",
      tool_scan_sub: "Use the camera.",
      tool_remove: "Remove pages",
      tool_remove_sub: "Delete pages.",
      tool_protect: "Protect PDF",
      tool_protect_sub: "Password protect.",
      tool_unlock: "Unlock",
      tool_unlock_sub: "Remove password.",
      tool_sign: "Sign PDF",
      tool_sign_sub: "Add signature.",
      tool_watermark: "Watermark",
      tool_watermark_sub: "Text or image.",
      tool_ocr: "Read text from photo",
      tool_premium: "Unlock everything",
      tool_premium_sub: "No daily limits, batch and no ads.",

      // SETTINGS
      settings_plan_free: "Free Plan",
      settings_plan_premium: "Premium Plan",
      settings_plan_free_sub: "Some features are limited",
      settings_plan_premium_sub: "Unlimited usage active ✓",
      settings_upgrade: "See plans",
      settings_usage_today: "Today's usage",
      settings_compressions: "Compressions",
      settings_ocr: "Text reading",
      settings_preferences: "Preferences",
      settings_theme: "Theme",
      settings_language: "Language",
      settings_coming_soon: "Coming soon",
      settings_data: "Data",
      settings_clear_history: "Clear history",
      settings_clear_cache: "Clear cache",
      settings_about: "About the app",
      settings_rate: "Rate the app",
      settings_privacy: "Privacy policy",
      settings_terms: "Terms of use",
      settings_version: "Version 1.0.0",
    },
  },
};

export async function initI18n() {
  const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
  const deviceLang = Localization.getLocales()[0]?.languageTag ?? "en";
  const lang = saved ?? (deviceLang.startsWith("pt") ? "pt-BR" : "en");

  await i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
}

export async function changeLanguage(lang: "pt-BR" | "en") {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

export default i18n;