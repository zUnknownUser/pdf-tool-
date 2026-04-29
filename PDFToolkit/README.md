# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.


Stylesheet
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F8",
    padding: 18,
  },

  privacy: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 12,
  },

  privacyText: {
    fontSize: 13,
    color: "#16A34A",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#FFF",
    borderRadius: 26,
    padding: 20,
    marginBottom: 18,
  },

  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#E8F2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
  },

  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 6,
  },

  tipBox: {
    marginTop: 16,
    backgroundColor: "#F0F7FF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D6E9FF",
  },

  tipTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#007AFF",
    marginBottom: 3,
  },

  tipText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },

  pickBtn: {
    marginTop: 16,
    backgroundColor: "#E8F2FF",
    padding: 14,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },

  pickText: {
    color: "#007AFF",
    fontWeight: "700",
  },

  secondaryPickBtn: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
  },

  secondaryPickText: {
    color: "#007AFF",
    fontWeight: "700",
  },

  fileSize: {
    marginTop: 10,
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },

  section: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6B7280",
    marginBottom: 8,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderRadius: 999,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  chipActive: {
    backgroundColor: "#007AFF",
  },

  chipText: {
    fontSize: 13,
  },

  chipTextActive: {
    color: "#FFF",
  },

  steps: {
    marginTop: 20,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 20,
  },

  stepsTitle: {
    fontWeight: "800",
    marginBottom: 10,
  },

  step: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 4,
  },

  stepText: {
    fontSize: 14,
  },

  mainBtn: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },

  disabledBtn: {
    opacity: 0.7,
  },

  mainText: {
    color: "#FFF",
    fontWeight: "800",
  },

  secondary: {
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },

  secondaryText: {
    fontWeight: "700",
  },
});