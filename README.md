# P.A.T.C.H-System Android WebView App

This repository scaffolds the P.A.T.C.H. System HUD as an Android application using a WebView container.

## Project Structure

- `/app/src/main/assets/www/index.html` – HUD HTML entrypoint loaded by WebView.
- `/app/src/main/java/com/patchsystem/hud/MainActivity.java` – Android activity and WebView runtime configuration.
- `/app/src/main/AndroidManifest.xml` – App manifest, launcher activity, and hardware acceleration settings.
- `/app/build.gradle` – Android app module configuration.

## Build an APK (Debug)

1. Install Android Studio (or Android SDK + command-line tools) and JDK 17.
2. Open this project in Android Studio, allow Gradle sync, and install requested SDK components (API 34).
3. Build the debug APK in Android Studio:
   - **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
4. Or from terminal (if you have a Gradle wrapper/system Gradle configured), run:
   ```bash
   gradle assembleDebug
   ```
5. Find the APK at:
   ```
   app/build/outputs/apk/debug/app-debug.apk
   ```
6. Install on a connected device/emulator:
   ```bash
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```

## Replacing the HUD

Replace `/app/src/main/assets/www/index.html` with your full single-file P.A.T.C.H. HUD HTML/CSS/JS.
