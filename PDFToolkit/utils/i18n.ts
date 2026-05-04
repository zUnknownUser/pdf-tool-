import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

const LANGUAGE_KEY = "PDF_LANGUAGE";

const resources = {
  "pt-BR": {
    translation: {
      // ─────────────────────────────────────────
      // HOME — seções
      // ─────────────────────────────────────────
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

      // ─────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────
history_title: "Histórico",
history_subtitle: "Busque, organize e compartilhe seus PDFs",
history_clear: "Limpar",
history_search_placeholder: "Buscar PDF...",

history_sort_recent: "Recentes",
history_sort_name: "Nome",
history_sort_size: "Tamanho",
history_select: "Selecionar",

history_selected_count: "{{count}} selecionado(s)",
history_share: "Compartilhar",
history_delete: "Excluir",

history_empty_title: "Nenhum arquivo ainda",
history_empty_subtitle: "Seus PDFs aparecerão aqui",

history_group_today: "Hoje",
history_group_yesterday: "Ontem",
history_group_week: "Esta semana",
history_group_older: "Mais antigos",

history_size_unknown: "Tamanho desconhecido",
history_possible_duplicate: "Possível duplicado",
history_already_opened: "Já aberto",

history_unavailable_title: "Indisponível",
history_open_unavailable_message: "Não foi possível abrir este arquivo.",
history_share_unavailable_message: "Não foi possível compartilhar este arquivo.",
history_open_pdf_title: "Abrir PDF",
history_share_pdf_title: "Compartilhar PDF",

history_remove_title: "Remover arquivo",
history_remove_message: "Deseja excluir este item?",

history_delete_selected_title: "Excluir selecionados",
history_delete_selected_message: "Deseja excluir {{count}} arquivo(s)?",

history_clear_title: "Limpar histórico",
history_clear_message: "Escolha uma opção:",
history_clear_all: "Limpar tudo",
history_remove_duplicates: "Remover duplicados",
history_remove_old: "Remover antigos (+30 dias)",


      // ─────────────────────────────────────────
// PREMIUM
// ─────────────────────────────────────────
premium_hero_title: "PDF Toolkit Premium",
premium_hero_text: "Processe sem limites, sem interrupções e com total privacidade.",
premium_features_title: "O que você ganha",
premium_plans_title: "Escolha seu plano",

premium_feature_unlimited_conversions: "Conversões ilimitadas por dia",
premium_feature_batch: "Processamento em lote (batch)",
premium_feature_no_daily_limits: "Sem limites diários",
premium_feature_protect_unlock: "Proteção e desbloqueio de PDFs",
premium_feature_ai_ocr: "OCR com IA ilimitado",
premium_feature_early_access: "Acesso antecipado a novidades",

premium_plan_monthly_label: "Mensal",
premium_plan_monthly_title: "Plano flexível",
premium_plan_monthly_description: "Ideal para usar quando precisar.",

premium_plan_annual_label: "Anual",
premium_plan_annual_title: "Melhor custo-benefício",
premium_plan_annual_description: "Economize assinando por ano.",
premium_plan_recommended: "Recomendado",

premium_cta: "Assinar agora",
premium_disclaimer:
  "Os preços reais aparecem na tela segura da RevenueCat · Cancele quando quiser · Renovação automática",

premium_error_title: "Erro",
premium_error_message: "Não foi possível abrir a tela de assinatura.",
premium_error_log: "Erro ao abrir paywall:",




      // HOME — goals
      goal_compress: "Reduzir tamanho",
      goal_merge: "Juntar arquivos",
      goal_image: "Converter imagens",
      goal_split: "Separar páginas",

      // HOME — ferramentas (cards)
      tool_compress: "Comprimir PDF",
      tool_compress_sub: "grátis hoje",
      tool_compress_remaining: "{{remaining}} de 3 grátis hoje",
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
      tool_ocr_remaining: "{{remaining}} de 2 grátis hoje",
      tool_premium: "Desbloquear tudo",
      tool_premium_sub: "Sem limites diários, batch e sem anúncios.",

      settings_used_today: "{{used}}/{{limit}} usadas hoje",

settings_clear_history_title: "Limpar histórico",
settings_clear_history_message: "Tem certeza? O histórico de arquivos será apagado.",
settings_clear_history_confirm: "Limpar",
settings_clear_history_success_title: "Pronto",
settings_clear_history_success_message: "Histórico apagado.",

settings_clear_cache_title: "Limpar cache",
settings_clear_cache_message: "Os arquivos temporários serão removidos.",
settings_clear_cache_confirm: "Limpar",
settings_clear_cache_success_title: "Pronto",
settings_clear_cache_success_message: "Cache limpo com sucesso.",

settings_cancel: "Cancelar",

// ─────────────────────────────────────────
// ONBOARDING
// ─────────────────────────────────────────
onboarding_slide_1_title: "Controle seus PDFs",
onboarding_slide_1_subtitle: "Comprima, converta e organize arquivos com facilidade.",

onboarding_slide_2_title: "Ferramentas inteligentes",
onboarding_slide_2_subtitle: "OCR, IA e ações rápidas em uma experiência simples.",

onboarding_slide_3_title: "Privacidade primeiro",
onboarding_slide_3_subtitle: "Processamento local sempre que possível.",

onboarding_slide_4_title: "Pronto em segundos",
onboarding_slide_4_subtitle: "Processe e compartilhe o resultado rapidamente.",

onboarding_secure: "Seguro",
onboarding_start: "Começar",
onboarding_continue: "Continuar",
onboarding_skip: "Pular",

settings_language_pt: "Português",
settings_language_en: "Inglês",
settings_language_select_title: "Escolher idioma",
settings_language_select_message: "Selecione o idioma do aplicativo.",
settings_language_changed_title: "Idioma alterado",
settings_language_changed_message: "O idioma do app foi atualizado.",

onboarding_mock_file_name: "documento.pdf",
onboarding_mock_file_info: "2.4 MB • PDF",
onboarding_mock_select: "Selecionar",
onboarding_mock_process: "Processar",
onboarding_mock_done: "Pronto",

settings_theme_alert_title: "Em breve",
settings_theme_alert_message: "Suporte a tema claro/escuro será adicionado em breve.",

settings_language_alert_title: "Em breve",
settings_language_alert_message: "Suporte a múltiplos idiomas será adicionado em breve.",

      // HOME — badges
      badge_free: "Grátis",
      badge_new: "Novo",
      badge_ai: "IA",
      badge_premium: "Premium",

      // HOME — privacidade (alert)
      privacy_alert_title: "Privacidade",
      privacy_alert_message:
        "A ideia do app é processar seus arquivos localmente no celular sempre que possível. Assim, seus PDFs não precisam sair do aparelho para tarefas como comprimir, juntar, dividir ou converter.",

      // ─────────────────────────────────────────
      // SETTINGS
      // ─────────────────────────────────────────
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

      // ─────────────────────────────────────────
      // ACTION — títulos das telas
      // ─────────────────────────────────────────
      action_title_compress: "Comprimir PDF",
      action_title_image_to_pdf: "Imagem para PDF",
      action_title_pdf_to_word: "PDF para Word",
      action_title_merge: "Juntar PDFs",
      action_title_split: "Dividir PDF",
      action_title_batch: "Modo lote",
      action_title_smart_picker: "Ação inteligente",
      action_title_rotate: "Rotacionar PDF",
      action_title_scan: "Escanear PDF",
      action_title_remove_pages: "Remover páginas",
      action_title_protect: "Proteger PDF",
      action_title_unlock: "Desbloquear PDF",
      action_title_sign: "Assinar PDF",
      action_title_watermark: "Marca d'água",
      action_title_ocr: "Ler texto da foto",
      action_title_preview: "Visualizar PDF",
      action_title_premium: "Premium",
      action_title_default: "Processar arquivo",

      // ACTION — subtítulos
      action_sub_ocr:
        "Extraia texto de imagens e use IA para resumir, explicar ou gerar perguntas.",
      action_sub_smart_picker:
        "Selecione um arquivo e o app sugere a melhor ação.",
      action_sub_batch:
        "Selecione até {{limit}} arquivos no plano grátis.",
      action_sub_preview: "Abra, confira e compartilhe seu PDF.",
      action_sub_premium:
        "Libere processamento ilimitado e ferramentas avançadas.",
      action_sub_scan: "Fotografe um documento e converta para PDF.",
      action_sub_pdf_to_word:
        "Converta seu PDF em documento Word editável.",
      action_sub_default: "Escolha o arquivo e processe em segundos.",

      // ─────────────────────────────────────────
// HOME HEADER
// ─────────────────────────────────────────
home_tip_1: "Use o Modo Lote pra comprimir vários PDFs de uma vez.",
home_tip_2: "Dá pra juntar imagens e PDFs em um único arquivo.",
home_tip_3: "O OCR transforma PDF escaneado em texto pesquisável.",
home_tip_4: "Você pode proteger qualquer PDF com senha em segundos.",
home_tip_5: "Dividir um PDF grande facilita o envio por e-mail.",
home_tip_6: "A câmera do app escaneia documentos direto em PDF.",
home_tip_7: "Marca d'água protege seus documentos de cópias.",
home_tip_8: "Dá pra remover páginas específicas sem abrir o arquivo.",

      // ACTION — barra de privacidade
      action_privacy_text: "Processamento local sempre que possível",

      // ACTION — seleção de arquivo
      action_pick_gallery: "Escolher da Galeria",
      action_pick_files: "Escolher dos Arquivos",
      action_pick_multiple: "Selecionar arquivos",
      action_pick_single: "Selecionar arquivo",
      action_files_selected: "{{count}} arquivos selecionados",
      action_image_selected_one: "1 imagem selecionada",
      action_images_selected: "{{count}} imagens selecionadas",
      action_file_size: "Tamanho: {{size}}",
      action_file_size_unknown: "Tamanho desconhecido",

      // ACTION — botões principais
      action_btn_process: "Processar",
      action_btn_plans: "Ver planos",
      action_btn_extract_text: "Extrair texto",
      action_btn_share: "Compartilhar arquivo",

      // ACTION — steps
      action_steps_title: "3 passos",
      action_step_select: "Selecionar arquivo",
      action_step_process: "Processar",
      action_step_extract: "Extrair texto",
      action_step_share: "Compartilhar",
      action_step_use_ai: "Usar IA",

      // ACTION — campos de formulário
      action_label_password: "Senha",
      action_label_pages: "Páginas",
      action_label_watermark_text: "Texto da marca d'água",
      action_placeholder_password: "Digite a senha do PDF",
      action_placeholder_pages: "Ex: 1-3, 5, 8",
      action_placeholder_watermark: "Ex: CONFIDENCIAL",

      // ACTION — OCR / IA
      action_ocr_how_title: "Como funciona",
      action_ocr_how_text:
        "Escolha uma imagem com texto. Primeiro o app extrai o texto, depois você pode resumir, explicar ou gerar perguntas com IA.",
      action_ocr_extracted: "Texto extraído",
      action_ocr_use_ai: "Usar IA",
      action_ocr_summarize: "Resumir texto",
      action_ocr_explain: "Explicar conteúdo",
      action_ocr_important: "Extrair dados importantes",
      action_ocr_questions: "Gerar perguntas",
      action_ocr_ai_result: "Resultado da IA",
      action_ocr_no_result: "A IA não retornou resultado.",

      // ACTION — assinatura
      action_sign_screen_title: "Assinar PDF",
      action_sign_screen_subtitle:
        "Desenhe sua assinatura e toque em Salvar",
      action_sign_description: "Assine no espaço abaixo",
      action_sign_clear: "Limpar",
      action_sign_save: "Salvar",
      action_sign_cancel: "Cancelar",
      action_sign_found_title: "Assinatura salva encontrada",
      action_sign_found_message: "Deseja usar sua assinatura salva?",
      action_sign_use_saved: "Usar",
      action_sign_new: "Nova assinatura",

      // ACTION — box premium
      action_premium_feature_title: "Batch ilimitado",
      action_premium_feature_text:
        "Libere processamento em lote, ferramentas avançadas e uso sem limite diário.",

      // ─────────────────────────────────────────
      // ALERTS — sucesso
      // ─────────────────────────────────────────
      alert_ocr_title: "OCR concluído",
      alert_ocr_message: "Texto extraído com sucesso.",
      alert_sign_title: "PDF assinado",
      alert_sign_message: "Sua assinatura foi salva e aplicada ao PDF.",
      alert_sign_saved_message: "Sua assinatura salva foi usada.",
      alert_protect_title: "PDF protegido",
      alert_protect_message: "Seu PDF foi protegido com senha.",
      alert_watermark_title: "Marca d'água aplicada",
      alert_unlock_title: "PDF desbloqueado",
      alert_unlock_message: "Seu PDF foi desbloqueado com sucesso.",
      alert_merge_title: "PDFs unidos",
      alert_merge_message: "Seus arquivos foram unidos com sucesso.",
      alert_split_title: "PDF dividido",
      alert_split_message:
        "Seu PDF foi dividido com sucesso. O resultado é um .zip.",
      alert_pdf_to_word_title: "Convertido!",
      alert_pdf_to_word_message:
        "Seu PDF foi convertido para Word com sucesso.",
      alert_rotate_title: "PDF rotacionado",
      alert_rotate_message: "Seu PDF foi rotacionado com sucesso.",
      alert_remove_pages_title: "Páginas removidas",
      alert_remove_pages_message: "As páginas foram removidas com sucesso.",
      alert_image_to_pdf_title: "PDF criado",
      alert_image_to_pdf_message: "Seu PDF foi gerado com sucesso.",
      alert_scan_title: "PDF criado",
      alert_scan_message: "Documento escaneado com sucesso.",
      alert_batch_title: "Modo lote pronto",
      alert_batch_message: "{{count}} arquivo(s) selecionado(s).",
      alert_smart_picker_title: "Ação inteligente",
      alert_smart_picker_message: "Sugestão já exibida.",
      alert_tool_ready: "Ferramenta preparada",
      alert_premium_title: "Premium ativado",
      alert_premium_message: "Seu acesso Premium foi liberado.",
      alert_share_title: "Compartilhar PDF",

      // ALERTS — sugestões (smart-picker)
      alert_suggest_title: "Sugestão",
      alert_suggest_merge:
        "Você selecionou vários PDFs. A melhor ação parece ser: Juntar PDFs.",
      alert_suggest_image:
        "Você selecionou uma imagem. A melhor ação parece ser: Imagem para PDF ou OCR.",
      alert_suggest_compress:
        "Esse PDF parece grande. A melhor ação parece ser: Comprimir PDF.",
      alert_suggest_generic:
        "Arquivo identificado. Você pode comprimir, dividir, proteger ou compartilhar.",
    },
  },

  en: {
    translation: {
      // ─────────────────────────────────────────
      // HOME — sections
      // ─────────────────────────────────────────
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

      // ─────────────────────────────────────────
// PREMIUM
// ─────────────────────────────────────────
premium_hero_title: "PDF Toolkit Premium",
premium_hero_text: "Process without limits, without interruptions, and with full privacy.",
premium_features_title: "What you get",
premium_plans_title: "Choose your plan",

premium_feature_unlimited_conversions: "Unlimited conversions per day",
premium_feature_batch: "Batch processing",
premium_feature_no_daily_limits: "No daily limits",
premium_feature_protect_unlock: "PDF protection and unlocking",
premium_feature_ai_ocr: "Unlimited AI OCR",
premium_feature_early_access: "Early access to new features",

premium_plan_monthly_label: "Monthly",
premium_plan_monthly_title: "Flexible plan",
premium_plan_monthly_description: "Ideal for using whenever you need.",

premium_plan_annual_label: "Annual",
premium_plan_annual_title: "Best value",
premium_plan_annual_description: "Save by subscribing yearly.",
premium_plan_recommended: "Recommended",

premium_cta: "Subscribe now",
premium_disclaimer:
  "Real prices appear on RevenueCat's secure screen · Cancel anytime · Automatic renewal",

  settings_used_today: "{{used}}/{{limit}} used today",

settings_clear_history_title: "Clear history",
settings_clear_history_message: "Are you sure? Your file history will be deleted.",
settings_clear_history_confirm: "Clear",
settings_clear_history_success_title: "Done",
settings_clear_history_success_message: "History cleared.",

settings_clear_cache_title: "Clear cache",
settings_clear_cache_message: "Temporary files will be removed.",
settings_clear_cache_confirm: "Clear",
settings_clear_cache_success_title: "Done",
settings_clear_cache_success_message: "Cache cleared successfully.",

settings_cancel: "Cancel",

settings_theme_alert_title: "Coming soon",
settings_theme_alert_message: "Light/dark theme support will be added soon.",

settings_language_alert_title: "Coming soon",
settings_language_alert_message: "Multiple language support will be added soon.",

premium_error_title: "Error",
premium_error_message: "Could not open the subscription screen.",
premium_error_log: "Error opening paywall:",

      // HOME — goals
      goal_compress: "Reduce size",
      goal_merge: "Merge files",
      goal_image: "Convert images",
      goal_split: "Split pages",

      // HOME — tool cards
      tool_compress: "Compress PDF",
      tool_compress_sub: "free today",
      tool_compress_remaining: "{{remaining}} of 3 free today",
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
      tool_ocr_remaining: "{{remaining}} of 2 free today",
      tool_premium: "Unlock everything",
      tool_premium_sub: "No daily limits, batch and no ads.",

      // HOME — badges
      badge_free: "Free",
      badge_new: "New",
      badge_ai: "AI",
      badge_premium: "Premium",

      // HOME — privacy alert
      privacy_alert_title: "Privacy",
      privacy_alert_message:
        "This app processes your files locally on your device whenever possible. Your PDFs don't need to leave your phone for tasks like compressing, merging, splitting, or converting.",

      // ─────────────────────────────────────────
      // SETTINGS
      // ─────────────────────────────────────────
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

      // ─────────────────────────────────────────
      // ACTION — screen titles
      // ─────────────────────────────────────────
      action_title_compress: "Compress PDF",
      action_title_image_to_pdf: "Image to PDF",
      action_title_pdf_to_word: "PDF to Word",
      action_title_merge: "Merge PDFs",
      action_title_split: "Split PDF",
      action_title_batch: "Batch mode",
      action_title_smart_picker: "Smart action",
      action_title_rotate: "Rotate PDF",
      action_title_scan: "Scan PDF",
      action_title_remove_pages: "Remove pages",
      action_title_protect: "Protect PDF",
      action_title_unlock: "Unlock PDF",
      action_title_sign: "Sign PDF",
      action_title_watermark: "Watermark",
      action_title_ocr: "Read text from photo",
      action_title_preview: "Preview PDF",
      action_title_premium: "Premium",
      action_title_default: "Process file",

      settings_language_pt: "Portuguese",
settings_language_en: "English",
settings_language_select_title: "Choose language",
settings_language_select_message: "Select the app language.",
settings_language_changed_title: "Language changed",
settings_language_changed_message: "The app language has been updated.",

      // ─────────────────────────────────────────
// ONBOARDING
// ─────────────────────────────────────────
onboarding_slide_1_title: "Control your PDFs",
onboarding_slide_1_subtitle: "Compress, convert, and organize files with ease.",

onboarding_slide_2_title: "Smart tools",
onboarding_slide_2_subtitle: "OCR, AI, and quick actions in a simple experience.",

onboarding_slide_3_title: "Privacy first",
onboarding_slide_3_subtitle: "Local processing whenever possible.",

onboarding_slide_4_title: "Ready in seconds",
onboarding_slide_4_subtitle: "Process and share the result quickly.",

onboarding_secure: "Secure",
onboarding_start: "Start",
onboarding_continue: "Continue",
onboarding_skip: "Skip",

// ─────────────────────────────────────────
// HOME HEADER
// ─────────────────────────────────────────
home_tip_1: "Use Batch Mode to compress multiple PDFs at once.",
home_tip_2: "You can merge images and PDFs into a single file.",
home_tip_3: "OCR turns scanned PDFs into searchable text.",
home_tip_4: "You can protect any PDF with a password in seconds.",
home_tip_5: "Splitting a large PDF makes it easier to send by email.",
home_tip_6: "The app camera scans documents directly into PDF.",
home_tip_7: "A watermark helps protect your documents from copies.",
home_tip_8: "You can remove specific pages without opening the file.",

onboarding_mock_file_name: "document.pdf",
onboarding_mock_file_info: "2.4 MB • PDF",
onboarding_mock_select: "Select",
onboarding_mock_process: "Process",
onboarding_mock_done: "Done",

      // ACTION — subtitles
      action_sub_ocr:
        "Extract text from images and use AI to summarize, explain, or generate questions.",
      action_sub_smart_picker:
        "Select a file and the app suggests the best action.",
      action_sub_batch:
        "Select up to {{limit}} files on the free plan.",
      action_sub_preview: "Open, review, and share your PDF.",
      action_sub_premium:
        "Unlock unlimited processing and advanced tools.",
      action_sub_scan: "Photograph a document and convert it to PDF.",
      action_sub_pdf_to_word: "Convert your PDF into an editable Word document.",
      action_sub_default: "Choose the file and process in seconds.",

      // ACTION — privacy bar
      action_privacy_text: "Local processing whenever possible",

      // ACTION — file selection
      action_pick_gallery: "Choose from Gallery",
      action_pick_files: "Choose from Files",
      action_pick_multiple: "Select files",
      action_pick_single: "Select file",
      action_files_selected: "{{count}} files selected",
      action_image_selected_one: "1 image selected",
      action_images_selected: "{{count}} images selected",
      action_file_size: "Size: {{size}}",
      action_file_size_unknown: "Unknown size",

      // ACTION — main buttons
      action_btn_process: "Process",
      action_btn_plans: "See plans",
      action_btn_extract_text: "Extract text",
      action_btn_share: "Share file",

      // ACTION — steps
      action_steps_title: "3 steps",
      action_step_select: "Select file",
      action_step_process: "Process",
      action_step_extract: "Extract text",
      action_step_share: "Share",
      action_step_use_ai: "Use AI",

      // ACTION — form fields
      action_label_password: "Password",
      action_label_pages: "Pages",
      action_label_watermark_text: "Watermark text",
      action_placeholder_password: "Enter the PDF password",
      action_placeholder_pages: "e.g. 1-3, 5, 8",
      action_placeholder_watermark: "e.g. CONFIDENTIAL",

      // ACTION — OCR / AI
      action_ocr_how_title: "How it works",
      action_ocr_how_text:
        "Choose an image with text. The app first extracts the text, then you can summarize, explain, or generate questions with AI.",
      action_ocr_extracted: "Extracted text",
      action_ocr_use_ai: "Use AI",
      action_ocr_summarize: "Summarize text",
      action_ocr_explain: "Explain content",
      action_ocr_important: "Extract key data",
      action_ocr_questions: "Generate questions",
      action_ocr_ai_result: "AI result",
      action_ocr_no_result: "AI returned no result.",

      // ACTION — signature
      action_sign_screen_title: "Sign PDF",
      action_sign_screen_subtitle: "Draw your signature and tap Save",
      action_sign_description: "Sign in the space below",
      action_sign_clear: "Clear",
      action_sign_save: "Save",
      action_sign_cancel: "Cancel",
      action_sign_found_title: "Saved signature found",
      action_sign_found_message: "Would you like to use your saved signature?",
      action_sign_use_saved: "Use",
      action_sign_new: "New signature",

      // ─────────────────────────────────────────
// HISTORY
// ─────────────────────────────────────────
history_title: "Histórico",
history_subtitle: "Busque, organize e compartilhe seus PDFs",
history_clear: "Limpar",
history_search_placeholder: "Buscar PDF...",

history_sort_recent: "Recentes",
history_sort_name: "Nome",
history_sort_size: "Tamanho",
history_select: "Selecionar",

history_selected_count: "{{count}} selecionado(s)",
history_share: "Compartilhar",
history_delete: "Excluir",

history_empty_title: "Nenhum arquivo ainda",
history_empty_subtitle: "Seus PDFs aparecerão aqui",

history_group_today: "Hoje",
history_group_yesterday: "Ontem",
history_group_week: "Esta semana",
history_group_older: "Mais antigos",

history_size_unknown: "Tamanho desconhecido",
history_possible_duplicate: "Possível duplicado",
history_already_opened: "Já aberto",

history_unavailable_title: "Indisponível",
history_open_unavailable_message: "Não foi possível abrir este arquivo.",
history_share_unavailable_message: "Não foi possível compartilhar este arquivo.",
history_open_pdf_title: "Abrir PDF",
history_share_pdf_title: "Compartilhar PDF",

history_remove_title: "Remover arquivo",
history_remove_message: "Deseja excluir este item?",

history_delete_selected_title: "Excluir selecionados",
history_delete_selected_message: "Deseja excluir {{count}} arquivo(s)?",

history_clear_title: "Limpar histórico",
history_clear_message: "Escolha uma opção:",
history_clear_all: "Limpar tudo",
history_remove_duplicates: "Remover duplicados",
history_remove_old: "Remover antigos (+30 dias)",
      // ACTION — premium box
      action_premium_feature_title: "Unlimited batch",
      action_premium_feature_text:
        "Unlock batch processing, advanced tools, and no daily limits.",
        alert_compress_title: "PDF compressed",
        alert_compress_message: "Your PDF was compressed successfully.",
        

        

      // ─────────────────────────────────────────
      // ALERTS — success
      // ─────────────────────────────────────────
      alert_ocr_title: "OCR complete",
      alert_ocr_message: "Text extracted successfully.",
      alert_sign_title: "PDF signed",
      alert_sign_message: "Your signature was saved and applied to the PDF.",
      alert_sign_saved_message: "Your saved signature was used.",
      alert_protect_title: "PDF protected",
      alert_protect_message: "Your PDF has been password protected.",
      alert_watermark_title: "Watermark applied",
      alert_unlock_title: "PDF unlocked",
      alert_unlock_message: "Your PDF was unlocked successfully.",
      alert_merge_title: "PDFs merged",
      alert_merge_message: "Your files were merged successfully.",
      alert_split_title: "PDF split",
      alert_split_message:
        "Your PDF was split successfully. The result is a .zip file.",
      alert_pdf_to_word_title: "Converted!",
      alert_pdf_to_word_message: "Your PDF was converted to Word successfully.",
      alert_rotate_title: "PDF rotated",
      alert_rotate_message: "Your PDF was rotated successfully.",
      alert_remove_pages_title: "Pages removed",
      alert_remove_pages_message: "The pages were removed successfully.",
      alert_image_to_pdf_title: "PDF created",
      alert_image_to_pdf_message: "Your PDF was generated successfully.",
      alert_scan_title: "PDF created",
      alert_scan_message: "Document scanned successfully.",
      alert_batch_title: "Batch mode ready",
      alert_batch_message: "{{count}} file(s) selected.",
      alert_smart_picker_title: "Smart action",
      alert_smart_picker_message: "Suggestion already shown.",
      alert_tool_ready: "Tool ready",
      alert_premium_title: "Premium activated",
      alert_premium_message: "Your Premium access has been unlocked.",
      alert_share_title: "Share PDF",

      // ALERTS — suggestions (smart-picker)
      alert_suggest_title: "Suggestion",
      alert_suggest_merge:
        "You selected multiple PDFs. The best action seems to be: Merge PDFs.",
      alert_suggest_image:
        "You selected an image. The best action seems to be: Image to PDF or OCR.",
      alert_suggest_compress:
        "This PDF looks large. The best action seems to be: Compress PDF.",
      alert_suggest_generic:
        "File identified. You can compress, split, protect, or share it.",
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