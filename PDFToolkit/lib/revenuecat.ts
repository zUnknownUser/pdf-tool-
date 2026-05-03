import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";

const REVENUECAT_API_KEY = "test_rulmvJsatJoQpkyIYXTeEsLqMZH";

let configured = false;

export function configureRevenueCat() {
  if (configured) return;

  Purchases.setLogLevel(LOG_LEVEL.VERBOSE);

  if (Platform.OS === "ios" || Platform.OS === "android") {
    Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
    });

    configured = true;
  }
}

export async function presentPaywall(): Promise<boolean> {
  const paywallResult: PAYWALL_RESULT = await RevenueCatUI.presentPaywall();

  switch (paywallResult) {
    case PAYWALL_RESULT.NOT_PRESENTED:
    case PAYWALL_RESULT.ERROR:
    case PAYWALL_RESULT.CANCELLED:
      return false;

    case PAYWALL_RESULT.PURCHASED:
    case PAYWALL_RESULT.RESTORED:
      return true;

    default:
      return false;
  }
}

export async function isPremiumUser(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();

    return typeof customerInfo.entitlements.active["premium"] !== "undefined";
  } catch (e) {
    console.log("Erro ao buscar entitlement:", e);
    return false;
  }
}