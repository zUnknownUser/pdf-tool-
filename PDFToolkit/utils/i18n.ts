import { I18n } from "i18n-js";
import { getLocales } from "expo-localization";

export const translations = {
  pt: {
    common: {
      save: "Salvar",
      cancel: "Cancelar",
      loading: "Carregando...",
      error: "Erro",
      success: "Sucesso",
    },
    home: {
      title: "PDF Toolkit",
      subtitle: "Organize e edite seus PDFs com facilidade",
    },
  },

  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      loading: "Loading...",
      error: "Error",
      success: "Success",
    },
    home: {
      title: "PDF Toolkit",
      subtitle: "Organize and edit your PDFs easily",
    },
  },
};

const i18n = new I18n(translations);

const deviceLanguage = getLocales()[0]?.languageCode || "pt";

i18n.locale = deviceLanguage;
i18n.defaultLocale = "pt";
i18n.enableFallback = true;

export default i18n;