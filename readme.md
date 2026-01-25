# TEADORO - Configuración WiFi por BLE para ESP32

Este proyecto permite configurar la red WiFi de un dispositivo ESP32 a través de una aplicación móvil React Native usando Bluetooth Low Energy (BLE).

## Requisitos

- Node.js >= 18.x
- npm >= 9.x
- Git
- Android Studio (para emulador o build APK)
- Dispositivo Android físico (recomendado para pruebas BLE)
- ESP32 con firmware incluido en `/src/Test/ESP32.ino`

## Instalación

1. **Clona el repositorio:**

   ```bash
   git clone https://github.com/ChisZuzunaga/TEADORO-APP.git
   cd TEADORO-APP
   ```

2. **Instala las dependencias:**

   ```bash
   npm install
   ```

3. **Instala dependencias nativas:**

   Algunas librerías requieren instalación nativa:

   ```bash
   npx expo install react-native-ble-plx react-native-wifi-reborn @expo/vector-icons
   ```

   Si usas Expo Bare/React Native CLI, ejecuta:

   ```bash
   npx pod-install
   ```

4. **Configura permisos Android:**

   Asegúrate de que `android/app/src/main/AndroidManifest.xml` incluya:

   ```xml
   <uses-permission android:name="android.permission.BLUETOOTH" />
   <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
   <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
   <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
   <uses-permission android:name="android.permission.CHANGE_WIFI_STATE" />
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
   <uses-feature android:name="android.hardware.bluetooth_le" android:required="true" />
   ```

5. **Build del proyecto para Android:**

   Para ejecutar en un dispositivo Android físico o generar un APK:

   ```bash
   npx expo run:android
   ```
   o si usas React Native CLI:
   ```bash
   npx react-native run-android
   ```

   > **Nota:** El build es obligatorio para que funcionen los módulos nativos BLE y WiFi. No uses Expo Go.

6. **Carga el firmware al ESP32:**

   - Abre `/src/Test/ESP32.ino` en Arduino IDE o PlatformIO.
   - Configura tu WiFi y sube el firmware al ESP32.

7. **Conecta y configura:**

   - Abre la app en tu Android.
   - Enciende el ESP32 y sigue los pasos para conectar por BLE y enviar las credenciales WiFi.

## Notas adicionales

- Si tienes problemas con permisos BLE/WiFi, revisa los permisos en Android y otorga manualmente desde Ajustes.
- Para debug, usa `adb logcat` o el panel de logs de Android Studio.
- El proyecto no es compatible con Expo Go, solo build nativo.

## Estructura del proyecto

- `App.js` / `index.js`: Entrada principal de la app
- `src/screens/`: Pantallas principales (conexión BLE, WiFi, éxito)
- `src/components/`: Componentes reutilizables (modales, banners)
- `src/ble/`: Utilidades BLE y base64
- `src/Test/ESP32.ino`: Firmware para ESP32

## Licencia

MIT
