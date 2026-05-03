// utils/showAppError.ts

import { Alert, Linking } from "react-native";
import type { AppFriendlyError } from "./appErrors";

type ShowAppErrorOptions = {
  onPickFile?: () => void;
  onPickImage?: () => void;
  onTryAgain?: () => void;
  onGoPremium?: () => void;
  onUnlockPdf?: () => void;
  onCompressPdf?: () => void;
  onOpenHistory?: () => void;
  onClearCache?: () => void;
};

export function showAppError(
  error: AppFriendlyError,
  options: ShowAppErrorOptions = {}
) {
  if (error.shouldLog !== false) {
    console.log("[APP_ERROR]", {
      code: error.code,
      title: error.title,
      message: error.message,
      technicalMessage: error.technicalMessage,
    });
  }

  const buttons = [];

  if (error.actionLabel && error.action && error.action !== "none") {
    buttons.push({
      text: error.actionLabel,
      onPress: () => {
        switch (error.action) {
          case "pick_file":
            options.onPickFile?.();
            break;

          case "pick_image":
            options.onPickImage?.();
            break;

          case "try_again":
            options.onTryAgain?.();
            break;

          case "go_premium":
            options.onGoPremium?.();
            break;

          case "unlock_pdf":
            options.onUnlockPdf?.();
            break;

          case "compress_pdf":
            options.onCompressPdf?.();
            break;

          case "open_history":
            options.onOpenHistory?.();
            break;

          case "clear_cache":
            options.onClearCache?.();
            break;

          case "open_settings":
            Linking.openSettings();
            break;

          default:
            break;
        }
      },
    });
  }

  buttons.push({
    text: "Entendi",
    style: "cancel" as const,
  });

  Alert.alert(error.title, error.message, buttons);
}