export type PdfToolContext =
  | "compress"
  | "image-to-pdf"
  | "pdf-to-word"
  | "merge"
  | "split"
  | "batch"
  | "smart-picker"
  | "rotate"
  | "scan"
  | "remove-pages"
  | "protect"
  | "unlock"
  | "sign"
  | "watermark"
  | "ocr"
  | "preview"
  | "share"
  | "history"
  | "premium"
  | "ai"
  | "camera"
  | "gallery"
  | "file-picker"
  | "save"
  | "download"
  | "upload"
  | "unknown";

export type AppErrorCode =
  | "NO_FILE_SELECTED"
  | "NO_IMAGE_SELECTED"
  | "INVALID_FILE"
  | "INVALID_PDF"
  | "INVALID_IMAGE"
  | "PDF_PROTECTED"
  | "PDF_PASSWORD_REQUIRED"
  | "PDF_WRONG_PASSWORD"
  | "PDF_CORRUPTED"
  | "PDF_NOT_EDITABLE"
  | "FILE_TOO_LARGE"
  | "TOO_MANY_FILES"
  | "MIN_FILES_REQUIRED"
  | "INVALID_PAGE_RANGE"
  | "PERMISSION_DENIED"
  | "CAMERA_PERMISSION_DENIED"
  | "GALLERY_PERMISSION_DENIED"
  | "FILE_PICKER_FAILED"
  | "CAMERA_FAILED"
  | "GALLERY_FAILED"
  | "OCR_NO_TEXT_FOUND"
  | "OCR_FAILED"
  | "AI_EMPTY_TEXT"
  | "AI_FAILED"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "API_UNAVAILABLE"
  | "TIMEOUT"
  | "UPLOAD_FAILED"
  | "DOWNLOAD_FAILED"
  | "SAVE_FAILED"
  | "SHARE_FAILED"
  | "HISTORY_LOAD_FAILED"
  | "HISTORY_SAVE_FAILED"
  | "HISTORY_DELETE_FAILED"
  | "CACHE_CLEAR_FAILED"
  | "FREE_LIMIT_REACHED"
  | "PREMIUM_REQUIRED"
  | "PAYWALL_FAILED"
  | "SUBSCRIPTION_FAILED"
  | "SIGNATURE_REQUIRED"
  | "SIGNATURE_SAVE_FAILED"
  | "SIGNATURE_APPLY_FAILED"
  | "WATERMARK_TEXT_REQUIRED"
  | "PASSWORD_REQUIRED"
  | "BACKEND_FILE_URL_MISSING"
  | "OPERATION_CANCELLED"
  | "FEATURE_NOT_READY"
  | "UNKNOWN_ERROR";

export type AppErrorAction =
  | "pick_file"
  | "pick_image"
  | "open_settings"
  | "try_again"
  | "compress_pdf"
  | "unlock_pdf"
  | "go_premium"
  | "open_history"
  | "clear_cache"
  | "none";

export type AppFriendlyError = {
  code: AppErrorCode;
  title: string;
  message: string;
  actionLabel?: string;
  action?: AppErrorAction;
  technicalMessage?: string;
  shouldLog?: boolean;
};

const TOOL_NAMES: Record<PdfToolContext, string> = {
  compress: "comprimir PDF",
  "image-to-pdf": "criar PDF a partir de imagem",
  "pdf-to-word": "converter PDF para Word",
  merge: "juntar PDFs",
  split: "dividir PDF",
  batch: "processar em lote",
  "smart-picker": "analisar o arquivo",
  rotate: "rotacionar PDF",
  scan: "escanear documento",
  "remove-pages": "remover páginas",
  protect: "proteger PDF",
  unlock: "desbloquear PDF",
  sign: "assinar PDF",
  watermark: "aplicar marca d'água",
  ocr: "ler texto",
  preview: "visualizar PDF",
  share: "compartilhar arquivo",
  history: "carregar histórico",
  premium: "abrir Premium",
  ai: "usar a IA",
  camera: "abrir câmera",
  gallery: "abrir galeria",
  "file-picker": "selecionar arquivo",
  save: "salvar arquivo",
  download: "baixar arquivo",
  upload: "enviar arquivo",
  unknown: "processar arquivo",
};

export const APP_ERRORS: Record<AppErrorCode, AppFriendlyError> = {
  NO_FILE_SELECTED: {
    code: "NO_FILE_SELECTED",
    title: "Selecione um arquivo",
    message: "Escolha um PDF antes de continuar.",
    actionLabel: "Escolher PDF",
    action: "pick_file",
  },

  NO_IMAGE_SELECTED: {
    code: "NO_IMAGE_SELECTED",
    title: "Selecione uma imagem",
    message: "Escolha uma imagem da galeria ou tire uma foto antes de continuar.",
    actionLabel: "Escolher imagem",
    action: "pick_image",
  },

  INVALID_FILE: {
    code: "INVALID_FILE",
    title: "Arquivo inválido",
    message: "Não conseguimos abrir este arquivo. Escolha outro arquivo e tente novamente.",
    actionLabel: "Escolher outro arquivo",
    action: "pick_file",
  },

  INVALID_PDF: {
    code: "INVALID_PDF",
    title: "PDF inválido",
    message: "Este arquivo não parece ser um PDF válido. Escolha outro PDF e tente novamente.",
    actionLabel: "Escolher outro PDF",
    action: "pick_file",
  },

  INVALID_IMAGE: {
    code: "INVALID_IMAGE",
    title: "Imagem inválida",
    message: "Esta imagem não pôde ser lida. Tente selecionar outra imagem da galeria.",
    actionLabel: "Escolher outra imagem",
    action: "pick_image",
  },

  PDF_PROTECTED: {
    code: "PDF_PROTECTED",
    title: "PDF protegido",
    message: "Este PDF parece estar protegido. Desbloqueie o arquivo antes de editar, juntar, comprimir ou converter.",
    actionLabel: "Desbloquear PDF",
    action: "unlock_pdf",
  },

  PDF_PASSWORD_REQUIRED: {
    code: "PDF_PASSWORD_REQUIRED",
    title: "Senha necessária",
    message: "Este PDF precisa de senha para continuar. Digite a senha do arquivo e tente novamente.",
    actionLabel: "Digitar senha",
    action: "none",
  },

  PDF_WRONG_PASSWORD: {
    code: "PDF_WRONG_PASSWORD",
    title: "Senha incorreta",
    message: "Não foi possível desbloquear o PDF. Verifique se a senha está correta e tente novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  PDF_CORRUPTED: {
    code: "PDF_CORRUPTED",
    title: "PDF corrompido",
    message: "Este PDF parece estar corrompido ou incompleto. Tente usar outro arquivo.",
    actionLabel: "Escolher outro PDF",
    action: "pick_file",
  },

  PDF_NOT_EDITABLE: {
    code: "PDF_NOT_EDITABLE",
    title: "PDF não editável",
    message: "Este PDF não permite essa edição. O arquivo pode estar protegido, bloqueado ou ter uma estrutura incompatível.",
    actionLabel: "Tentar outro arquivo",
    action: "pick_file",
  },

  FILE_TOO_LARGE: {
    code: "FILE_TOO_LARGE",
    title: "Arquivo muito grande",
    message: "Este arquivo é grande demais para processar agora. Tente comprimir antes ou escolha um arquivo menor.",
    actionLabel: "Comprimir PDF",
    action: "compress_pdf",
  },

  TOO_MANY_FILES: {
    code: "TOO_MANY_FILES",
    title: "Muitos arquivos selecionados",
    message: "Você selecionou arquivos demais para esta operação. Reduza a quantidade e tente novamente.",
    actionLabel: "Selecionar novamente",
    action: "pick_file",
  },

  MIN_FILES_REQUIRED: {
    code: "MIN_FILES_REQUIRED",
    title: "Selecione mais arquivos",
    message: "Para juntar PDFs, selecione pelo menos 2 arquivos.",
    actionLabel: "Escolher PDFs",
    action: "pick_file",
  },

  INVALID_PAGE_RANGE: {
    code: "INVALID_PAGE_RANGE",
    title: "Intervalo inválido",
    message: "Digite um intervalo de páginas válido. Exemplo: 1-3, 5, 8.",
    actionLabel: "Corrigir intervalo",
    action: "none",
  },

  PERMISSION_DENIED: {
    code: "PERMISSION_DENIED",
    title: "Permissão necessária",
    message: "O app precisa de permissão para acessar seus arquivos. Ative a permissão e tente novamente.",
    actionLabel: "Abrir configurações",
    action: "open_settings",
  },

  CAMERA_PERMISSION_DENIED: {
    code: "CAMERA_PERMISSION_DENIED",
    title: "Permissão da câmera",
    message: "O app precisa de acesso à câmera para escanear documentos.",
    actionLabel: "Abrir configurações",
    action: "open_settings",
  },

  GALLERY_PERMISSION_DENIED: {
    code: "GALLERY_PERMISSION_DENIED",
    title: "Permissão da galeria",
    message: "O app precisa de acesso à galeria para selecionar imagens.",
    actionLabel: "Abrir configurações",
    action: "open_settings",
  },

  FILE_PICKER_FAILED: {
    code: "FILE_PICKER_FAILED",
    title: "Falha ao selecionar arquivo",
    message: "Não foi possível abrir o seletor de arquivos. Tente novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  CAMERA_FAILED: {
    code: "CAMERA_FAILED",
    title: "Erro ao abrir câmera",
    message: "Não foi possível abrir a câmera. Verifique a permissão ou tente novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  GALLERY_FAILED: {
    code: "GALLERY_FAILED",
    title: "Erro ao abrir galeria",
    message: "Não foi possível abrir a galeria. Tente novamente ou escolha um arquivo manualmente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  OCR_NO_TEXT_FOUND: {
    code: "OCR_NO_TEXT_FOUND",
    title: "Nenhum texto encontrado",
    message: "Não encontramos texto legível nessa imagem. Tente usar uma foto mais nítida, com boa iluminação e sem cortes.",
    actionLabel: "Escolher outra imagem",
    action: "pick_image",
  },

  OCR_FAILED: {
    code: "OCR_FAILED",
    title: "Erro no OCR",
    message: "Não foi possível reconhecer o texto. Tente usar uma imagem mais nítida ou um PDF com melhor qualidade.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  AI_EMPTY_TEXT: {
    code: "AI_EMPTY_TEXT",
    title: "Texto vazio",
    message: "Faça o OCR primeiro ou envie um texto antes de usar a IA.",
    actionLabel: "Fazer OCR",
    action: "none",
  },

  AI_FAILED: {
    code: "AI_FAILED",
    title: "Erro na IA",
    message: "Não foi possível usar a IA agora. Tente novamente em alguns instantes.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  NETWORK_ERROR: {
    code: "NETWORK_ERROR",
    title: "Sem conexão",
    message: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  SERVER_ERROR: {
    code: "SERVER_ERROR",
    title: "Erro no servidor",
    message: "Não foi possível concluir o processamento agora. Tente novamente em alguns instantes.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  API_UNAVAILABLE: {
    code: "API_UNAVAILABLE",
    title: "Serviço indisponível",
    message: "O serviço de processamento está temporariamente indisponível. Tente novamente mais tarde.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  TIMEOUT: {
    code: "TIMEOUT",
    title: "Processamento demorou demais",
    message: "O processamento demorou mais que o esperado. Tente novamente com um arquivo menor.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  UPLOAD_FAILED: {
    code: "UPLOAD_FAILED",
    title: "Falha ao enviar arquivo",
    message: "Não foi possível enviar o arquivo para processamento. Verifique sua conexão e tente novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  DOWNLOAD_FAILED: {
    code: "DOWNLOAD_FAILED",
    title: "Falha ao baixar arquivo",
    message: "O arquivo foi processado, mas não conseguimos baixá-lo para o dispositivo. Tente novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  SAVE_FAILED: {
    code: "SAVE_FAILED",
    title: "Falha ao salvar arquivo",
    message: "O arquivo foi processado, mas não conseguimos salvá-lo. Verifique o espaço disponível e tente novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  SHARE_FAILED: {
    code: "SHARE_FAILED",
    title: "Falha ao compartilhar",
    message: "Não foi possível compartilhar o arquivo. Verifique se ele ainda existe no dispositivo e tente novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  HISTORY_LOAD_FAILED: {
    code: "HISTORY_LOAD_FAILED",
    title: "Erro no histórico",
    message: "Não foi possível carregar o histórico. Tente novamente ou limpe o cache do app.",
    actionLabel: "Limpar cache",
    action: "clear_cache",
  },

  HISTORY_SAVE_FAILED: {
    code: "HISTORY_SAVE_FAILED",
    title: "Histórico não salvo",
    message: "O arquivo foi criado, mas não conseguimos salvar no histórico.",
    actionLabel: "Entendi",
    action: "none",
  },

  HISTORY_DELETE_FAILED: {
    code: "HISTORY_DELETE_FAILED",
    title: "Erro ao deletar",
    message: "Não foi possível remover este item do histórico. Tente novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  CACHE_CLEAR_FAILED: {
    code: "CACHE_CLEAR_FAILED",
    title: "Erro ao limpar cache",
    message: "Não foi possível limpar o cache agora. Tente novamente em alguns instantes.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  FREE_LIMIT_REACHED: {
    code: "FREE_LIMIT_REACHED",
    title: "Limite diário atingido",
    message: "Você usou todos os processamentos gratuitos de hoje. Volte amanhã ou assine o Premium para uso ilimitado.",
    actionLabel: "Ver Premium",
    action: "go_premium",
  },

  PREMIUM_REQUIRED: {
    code: "PREMIUM_REQUIRED",
    title: "Recurso Premium",
    message: "Esta ferramenta está disponível no Premium. Assine para liberar esse recurso e usar sem limites.",
    actionLabel: "Ver Premium",
    action: "go_premium",
  },

  PAYWALL_FAILED: {
    code: "PAYWALL_FAILED",
    title: "Erro ao abrir Premium",
    message: "Não foi possível abrir a tela de assinatura. Verifique sua conexão e tente novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  SUBSCRIPTION_FAILED: {
    code: "SUBSCRIPTION_FAILED",
    title: "Erro na assinatura",
    message: "Não foi possível confirmar sua assinatura agora. Tente novamente em alguns instantes.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  SIGNATURE_REQUIRED: {
    code: "SIGNATURE_REQUIRED",
    title: "Assinatura necessária",
    message: "Crie ou selecione uma assinatura antes de continuar.",
    actionLabel: "Criar assinatura",
    action: "none",
  },

  SIGNATURE_SAVE_FAILED: {
    code: "SIGNATURE_SAVE_FAILED",
    title: "Erro ao salvar assinatura",
    message: "Não foi possível salvar sua assinatura. Tente desenhar novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  SIGNATURE_APPLY_FAILED: {
    code: "SIGNATURE_APPLY_FAILED",
    title: "Erro ao assinar PDF",
    message: "Não foi possível aplicar a assinatura. Verifique se o PDF permite edição e tente novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  WATERMARK_TEXT_REQUIRED: {
    code: "WATERMARK_TEXT_REQUIRED",
    title: "Texto obrigatório",
    message: "Digite o texto que será usado como marca d'água.",
    actionLabel: "Digitar texto",
    action: "none",
  },

  PASSWORD_REQUIRED: {
    code: "PASSWORD_REQUIRED",
    title: "Senha obrigatória",
    message: "Digite uma senha para continuar.",
    actionLabel: "Digitar senha",
    action: "none",
  },

  BACKEND_FILE_URL_MISSING: {
    code: "BACKEND_FILE_URL_MISSING",
    title: "Resposta incompleta",
    message: "O servidor processou a solicitação, mas não retornou o arquivo final. Tente novamente.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },

  OPERATION_CANCELLED: {
    code: "OPERATION_CANCELLED",
    title: "Operação cancelada",
    message: "Nenhum arquivo foi alterado.",
    actionLabel: "Entendi",
    action: "none",
    shouldLog: false,
  },

  FEATURE_NOT_READY: {
    code: "FEATURE_NOT_READY",
    title: "Ferramenta em preparação",
    message: "Esta ferramenta ainda está sendo preparada. Em breve ela estará disponível.",
    actionLabel: "Entendi",
    action: "none",
  },

  UNKNOWN_ERROR: {
    code: "UNKNOWN_ERROR",
    title: "Algo deu errado",
    message: "Não foi possível concluir a operação. Tente novamente ou escolha outro arquivo.",
    actionLabel: "Tentar novamente",
    action: "try_again",
  },
};

export const TOOL_ERROR_MESSAGES: Partial<
  Record<PdfToolContext, Partial<Record<AppErrorCode, AppFriendlyError>>>
> = {
  compress: {
    SERVER_ERROR: {
      code: "SERVER_ERROR",
      title: "Erro ao comprimir PDF",
      message:
        "Não foi possível comprimir este PDF. O arquivo pode estar protegido, corrompido ou ser grande demais.",
      actionLabel: "Escolher outro PDF",
      action: "pick_file",
    },
    FREE_LIMIT_REACHED: {
      code: "FREE_LIMIT_REACHED",
      title: "Limite de compressão atingido",
      message:
        "Você usou suas 3 compressões gratuitas de hoje. Assine o Premium para uso ilimitado.",
      actionLabel: "Ver Premium",
      action: "go_premium",
    },
  },

  "image-to-pdf": {
    SERVER_ERROR: {
      code: "SERVER_ERROR",
      title: "Erro ao criar PDF",
      message:
        "Não foi possível criar o PDF. Uma ou mais imagens podem estar corrompidas ou em um formato incompatível.",
      actionLabel: "Escolher outras imagens",
      action: "pick_image",
    },
  },

  merge: {
    MIN_FILES_REQUIRED: {
      code: "MIN_FILES_REQUIRED",
      title: "Selecione pelo menos 2 PDFs",
      message: "Para juntar arquivos, você precisa selecionar dois ou mais PDFs.",
      actionLabel: "Escolher PDFs",
      action: "pick_file",
    },
    SERVER_ERROR: {
      code: "SERVER_ERROR",
      title: "Erro ao juntar PDFs",
      message:
        "Não foi possível juntar os PDFs. Verifique se todos os arquivos são PDFs válidos e se nenhum deles está protegido.",
      actionLabel: "Escolher novamente",
      action: "pick_file",
    },
  },

  split: {
    INVALID_PAGE_RANGE: {
      code: "INVALID_PAGE_RANGE",
      title: "Intervalo de páginas inválido",
      message: "Digite um intervalo válido. Exemplo: 1-3, 5, 8.",
      actionLabel: "Corrigir intervalo",
      action: "none",
    },
    SERVER_ERROR: {
      code: "SERVER_ERROR",
      title: "Erro ao dividir PDF",
      message:
        "Não foi possível dividir este PDF. O arquivo pode estar protegido ou o intervalo de páginas pode estar inválido.",
      actionLabel: "Tentar novamente",
      action: "try_again",
    },
  },

  rotate: {
    FEATURE_NOT_READY: {
      code: "FEATURE_NOT_READY",
      title: "Rotação ainda não disponível",
      message:
        "A ferramenta de rotacionar PDF ainda está em preparação. Ela aparece no app, mas a ação final ainda precisa ser implementada.",
      actionLabel: "Entendi",
      action: "none",
    },
    SERVER_ERROR: {
      code: "SERVER_ERROR",
      title: "Erro ao rotacionar PDF",
      message:
        "Não foi possível rotacionar este PDF. O arquivo pode estar protegido ou não permitir edição.",
      actionLabel: "Desbloquear PDF",
      action: "unlock_pdf",
    },
  },

  "remove-pages": {
    FEATURE_NOT_READY: {
      code: "FEATURE_NOT_READY",
      title: "Remoção de páginas em preparação",
      message:
        "A ferramenta de remover páginas ainda precisa ser finalizada antes de funcionar corretamente.",
      actionLabel: "Entendi",
      action: "none",
    },
  },

  protect: {
    PASSWORD_REQUIRED: {
      code: "PASSWORD_REQUIRED",
      title: "Senha obrigatória",
      message: "Digite uma senha para proteger o PDF.",
      actionLabel: "Digitar senha",
      action: "none",
    },
    SERVER_ERROR: {
      code: "SERVER_ERROR",
      title: "Erro ao proteger PDF",
      message:
        "Não foi possível proteger este PDF. Tente escolher outro arquivo ou verificar se ele já possui alguma restrição.",
      actionLabel: "Escolher outro PDF",
      action: "pick_file",
    },
  },

  unlock: {
    PASSWORD_REQUIRED: {
      code: "PASSWORD_REQUIRED",
      title: "Senha obrigatória",
      message: "Digite a senha atual do PDF para desbloquear.",
      actionLabel: "Digitar senha",
      action: "none",
    },
    PDF_WRONG_PASSWORD: {
      code: "PDF_WRONG_PASSWORD",
      title: "Senha incorreta",
      message:
        "Não foi possível desbloquear este PDF. A senha pode estar incorreta ou o arquivo pode ter uma proteção que não permite remoção.",
      actionLabel: "Tentar novamente",
      action: "try_again",
    },
  },

  sign: {
    SIGNATURE_APPLY_FAILED: {
      code: "SIGNATURE_APPLY_FAILED",
      title: "Erro ao assinar PDF",
      message:
        "Não foi possível adicionar a assinatura. Verifique se o PDF permite edição e tente novamente.",
      actionLabel: "Tentar novamente",
      action: "try_again",
    },
  },

  watermark: {
    WATERMARK_TEXT_REQUIRED: {
      code: "WATERMARK_TEXT_REQUIRED",
      title: "Texto obrigatório",
      message: "Digite o texto da marca d'água antes de continuar.",
      actionLabel: "Digitar texto",
      action: "none",
    },
    SERVER_ERROR: {
      code: "SERVER_ERROR",
      title: "Erro na marca d'água",
      message:
        "Não foi possível aplicar a marca d'água. O arquivo pode estar protegido ou não permitir edição.",
      actionLabel: "Desbloquear PDF",
      action: "unlock_pdf",
    },
  },

  ocr: {
    OCR_NO_TEXT_FOUND: {
      code: "OCR_NO_TEXT_FOUND",
      title: "Nenhum texto encontrado",
      message:
        "Não encontramos texto legível na imagem. Tente usar uma foto mais nítida, com boa luz e sem cortes.",
      actionLabel: "Escolher outra imagem",
      action: "pick_image",
    },
    OCR_FAILED: {
      code: "OCR_FAILED",
      title: "Erro no OCR",
      message:
        "Não foi possível reconhecer o texto. Essa função precisa rodar em Dev Build ou build nativa, não no Expo Go.",
      actionLabel: "Entendi",
      action: "none",
    },
    FREE_LIMIT_REACHED: {
      code: "FREE_LIMIT_REACHED",
      title: "Limite de OCR atingido",
      message:
        "Você usou suas 2 leituras de texto gratuitas de hoje. Assine o Premium para uso ilimitado.",
      actionLabel: "Ver Premium",
      action: "go_premium",
    },
  },

  "pdf-to-word": {
    PREMIUM_REQUIRED: {
      code: "PREMIUM_REQUIRED",
      title: "PDF para Word é Premium",
      message:
        "A conversão de PDF para Word está disponível no Premium. Assine para liberar essa ferramenta.",
      actionLabel: "Ver Premium",
      action: "go_premium",
    },
    SERVER_ERROR: {
      code: "SERVER_ERROR",
      title: "Erro ao converter para Word",
      message:
        "Não conseguimos converter este PDF para Word. O arquivo pode estar protegido, escaneado ou em formato incompatível.",
      actionLabel: "Tentar OCR",
      action: "none",
    },
  },

  batch: {
    TOO_MANY_FILES: {
      code: "TOO_MANY_FILES",
      title: "Limite do plano grátis",
      message:
        "O plano grátis permite processar poucos arquivos por vez. Assine o Premium para usar o modo lote sem limite.",
      actionLabel: "Ver Premium",
      action: "go_premium",
    },
  },

  scan: {
    CAMERA_PERMISSION_DENIED: {
      code: "CAMERA_PERMISSION_DENIED",
      title: "Permissão da câmera",
      message: "Permita acesso à câmera para escanear documentos e transformar em PDF.",
      actionLabel: "Abrir configurações",
      action: "open_settings",
    },
  },

  gallery: {
    GALLERY_PERMISSION_DENIED: {
      code: "GALLERY_PERMISSION_DENIED",
      title: "Permissão da galeria",
      message: "Permita acesso à galeria para selecionar imagens.",
      actionLabel: "Abrir configurações",
      action: "open_settings",
    },
  },

  ai: {
    AI_FAILED: {
      code: "AI_FAILED",
      title: "Erro na IA",
      message:
        "Não foi possível usar a IA agora. Verifique sua conexão e tente novamente.",
      actionLabel: "Tentar novamente",
      action: "try_again",
    },
  },
};

function normalizeText(value: unknown): string {
  if (!value) return "";

  if (typeof value === "string") return value.toLowerCase();

  if (value instanceof Error) {
    return `${value.name} ${value.message}`.toLowerCase();
  }

  try {
    return JSON.stringify(value).toLowerCase();
  } catch {
    return String(value).toLowerCase();
  }
}

export function detectErrorCode(error: unknown): AppErrorCode {
  const text = normalizeText(error);

  if (!text) return "UNKNOWN_ERROR";

  if (
    text.includes("network request failed") ||
    text.includes("failed to fetch") ||
    text.includes("networkerror") ||
    text.includes("internet") ||
    text.includes("conexão")
  ) {
    return "NETWORK_ERROR";
  }

  if (
    text.includes("timeout") ||
    text.includes("timed out") ||
    text.includes("demorou")
  ) {
    return "TIMEOUT";
  }

  if (
    text.includes("fileurl") ||
    text.includes("não retornou fileurl") ||
    text.includes("backend não retornou")
  ) {
    return "BACKEND_FILE_URL_MISSING";
  }

  if (
    text.includes("permission") ||
    text.includes("permissão") ||
    text.includes("denied")
  ) {
    return "PERMISSION_DENIED";
  }

  if (
    text.includes("password") ||
    text.includes("senha")
  ) {
    if (
      text.includes("wrong") ||
      text.includes("incorrect") ||
      text.includes("incorreta") ||
      text.includes("invalid password")
    ) {
      return "PDF_WRONG_PASSWORD";
    }

    return "PDF_PASSWORD_REQUIRED";
  }

  if (
    text.includes("protected") ||
    text.includes("encrypted") ||
    text.includes("protegido") ||
    text.includes("bloqueado")
  ) {
    return "PDF_PROTECTED";
  }

  if (
    text.includes("not a pdf") ||
    text.includes("não é um pdf") ||
    text.includes("nao é um pdf") ||
    text.includes("application/pdf")
  ) {
    return "INVALID_PDF";
  }

  if (
    text.includes("corrupt") ||
    text.includes("corrompido") ||
    text.includes("invalid pdf") ||
    text.includes("failed to parse pdf")
  ) {
    return "PDF_CORRUPTED";
  }

  if (
    text.includes("too large") ||
    text.includes("file too large") ||
    text.includes("payload too large") ||
    text.includes("80mb") ||
    text.includes("large") ||
    text.includes("grande demais")
  ) {
    return "FILE_TOO_LARGE";
  }

  if (
    text.includes("download") ||
    text.includes("baixar")
  ) {
    return "DOWNLOAD_FAILED";
  }

  if (
    text.includes("upload") ||
    text.includes("enviar")
  ) {
    return "UPLOAD_FAILED";
  }

  if (
    text.includes("save") ||
    text.includes("salvar") ||
    text.includes("write")
  ) {
    return "SAVE_FAILED";
  }

  if (
    text.includes("share") ||
    text.includes("compartilhar")
  ) {
    return "SHARE_FAILED";
  }

  if (
    text.includes("server") ||
    text.includes("status 500") ||
    text.includes("erro ao processar") ||
    text.includes("erro ao comprimir") ||
    text.includes("erro ao juntar") ||
    text.includes("erro ao dividir") ||
    text.includes("erro ao proteger") ||
    text.includes("erro ao desbloquear") ||
    text.includes("erro ao converter")
  ) {
    return "SERVER_ERROR";
  }

  return "UNKNOWN_ERROR";
}

export function getFriendlyError(
  error: unknown,
  context: PdfToolContext = "unknown",
  forcedCode?: AppErrorCode
): AppFriendlyError {
  const code = forcedCode ?? detectErrorCode(error);

  const baseError = APP_ERRORS[code] ?? APP_ERRORS.UNKNOWN_ERROR;
  const contextError = TOOL_ERROR_MESSAGES[context]?.[code];

  const friendlyError = contextError ?? baseError;

  return {
    ...friendlyError,
    technicalMessage: normalizeText(error),
    shouldLog: friendlyError.shouldLog ?? true,
  };
}

export function getFeatureNotReadyError(context: PdfToolContext): AppFriendlyError {
  return getFriendlyError(
    new Error(`Feature not ready: ${context}`),
    context,
    "FEATURE_NOT_READY"
  );
}

export function getNoFileError(context: PdfToolContext): AppFriendlyError {
  if (context === "image-to-pdf" || context === "ocr" || context === "gallery") {
    return getFriendlyError(new Error("No image selected"), context, "NO_IMAGE_SELECTED");
  }

  return getFriendlyError(new Error("No file selected"), context, "NO_FILE_SELECTED");
}

export function getFreeLimitError(context: PdfToolContext): AppFriendlyError {
  return getFriendlyError(new Error("Free limit reached"), context, "FREE_LIMIT_REACHED");
}

export function getPremiumRequiredError(context: PdfToolContext): AppFriendlyError {
  return getFriendlyError(new Error("Premium required"), context, "PREMIUM_REQUIRED");
}

export function formatToolError(error: unknown, context: PdfToolContext): AppFriendlyError {
  const friendly = getFriendlyError(error, context);

  if (friendly.code !== "UNKNOWN_ERROR") return friendly;

  const toolName = TOOL_NAMES[context] ?? "processar arquivo";

  return {
    ...friendly,
    title: "Não foi possível continuar",
    message: `Não foi possível ${toolName}. Tente novamente ou escolha outro arquivo.`,
  };
}