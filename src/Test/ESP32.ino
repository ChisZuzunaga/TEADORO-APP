#include <WiFi.h>
#include <NimBLEDevice.h>

// ================= UUIDs BLE =================
static const char* SERVICE_UUID        = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
static const char* WIFI_CRED_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"; // WRITE
static const char* STATUS_CHAR_UUID    = "caa1f2a0-9f7b-4d3f-b1d2-0d3c5f7c9a10"; // NOTIFY

// ================= BLE Globals =================
static NimBLECharacteristic* gStatusChar = nullptr;
static bool gDeviceConnected = false;

// ================= WiFi Control (anti "cannot set config") =================
static volatile bool gWifiConnecting = false;
static String gPendingSsid = "";
static String gPendingPass = "";

// ------------------------------------------------
static void notifyStatus(const String& json) {
  if (gStatusChar && gDeviceConnected) {
    gStatusChar->setValue((uint8_t*)json.c_str(), json.length());
    gStatusChar->notify();
  }
}

// Parse simple de {"ssid":"X","pass":"Y"} sin ArduinoJson
static bool extractJsonValue(const String& src, const String& key, String& out) {
  int k = src.indexOf("\"" + key + "\"");
  if (k < 0) return false;

  int colon = src.indexOf(':', k);
  if (colon < 0) return false;

  int firstQuote = src.indexOf('\"', colon + 1);
  if (firstQuote < 0) return false;

  int secondQuote = src.indexOf('\"', firstQuote + 1);
  if (secondQuote < 0) return false;

  out = src.substring(firstQuote + 1, secondQuote);
  return true;
}

static void connectToWiFiBlocking(const String& ssid, const String& pass) {
  gWifiConnecting = true;

  notifyStatus("{\"type\":\"wifi\",\"state\":\"connecting\"}");

  WiFi.mode(WIFI_STA);

  // Detener intento anterior y limpiar config
  WiFi.disconnect(true, true);
  delay(500);

  Serial.print("Connecting to SSID: ");
  Serial.println(ssid);

  WiFi.begin(ssid.c_str(), pass.c_str());

  const unsigned long start = millis();
  const unsigned long timeoutMs = 25000;

  while (WiFi.status() != WL_CONNECTED && (millis() - start) < timeoutMs) {
    delay(250);
  }

  if (WiFi.status() == WL_CONNECTED) {
    String ip = WiFi.localIP().toString();
    Serial.print("WiFi connected, IP: ");
    Serial.println(ip);

    notifyStatus("{\"type\":\"wifi\",\"state\":\"connected\",\"ip\":\"" + ip + "\"}");
  } else {
    Serial.print("WiFi failed. status=");
    Serial.println((int)WiFi.status());

    notifyStatus("{\"type\":\"wifi\",\"state\":\"error\",\"reason\":\"timeout_or_auth\"}");
    WiFi.disconnect(true, true);
  }

  gWifiConnecting = false;

  // Si llegó una nueva solicitud mientras conectaba, reintenta con la última
  if (gPendingSsid.length() > 0) {
    String nextSsid = gPendingSsid;
    String nextPass = gPendingPass;
    gPendingSsid = "";
    gPendingPass = "";
    connectToWiFiBlocking(nextSsid, nextPass);
  }
}

// ================= Callbacks NimBLE-Arduino 2.x =================
class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override {
    gDeviceConnected = true;
    notifyStatus("{\"type\":\"ble\",\"state\":\"connected\"}");
  }

  void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override {
    gDeviceConnected = false;
    NimBLEDevice::startAdvertising(); // reanuncia para reconectar
  }
};

class WifiCredCallbacks : public NimBLECharacteristicCallbacks {
  void onWrite(NimBLECharacteristic* pCharacteristic, NimBLEConnInfo& connInfo) override {
    std::string value = pCharacteristic->getValue();
    if (value.empty()) return;

    String payload = String(value.c_str());
    payload.trim();

    String ssid, pass;
    bool okSsid = extractJsonValue(payload, "ssid", ssid);
    bool okPass = extractJsonValue(payload, "pass", pass);

    if (!okSsid) {
      notifyStatus("{\"type\":\"wifi\",\"state\":\"error\",\"reason\":\"missing_ssid\"}");
      return;
    }
    if (!okPass) pass = ""; // permitir redes abiertas

    notifyStatus("{\"type\":\"wifi\",\"state\":\"received\"}");

    // Si ya está conectando, guardar la última solicitud y no pisar config
    if (gWifiConnecting) {
      gPendingSsid = ssid;
      gPendingPass = pass;
      notifyStatus("{\"type\":\"wifi\",\"state\":\"queued\"}");
      return;
    }

    connectToWiFiBlocking(ssid, pass);
  }
};

void setup() {
  Serial.begin(115200);
  delay(200);

  String bleName = "Teddy-ESP32";

  NimBLEDevice::init(bleName.c_str());
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);

  NimBLEServer* server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  NimBLEService* service = server->createService(SERVICE_UUID);

  // WRITE credenciales
  NimBLECharacteristic* wifiCredChar = service->createCharacteristic(
    WIFI_CRED_CHAR_UUID,
    NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
  );
  wifiCredChar->setCallbacks(new WifiCredCallbacks());

  // NOTIFY estado
  gStatusChar = service->createCharacteristic(
    STATUS_CHAR_UUID,
    NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ
  );
  gStatusChar->setValue("{\"type\":\"boot\",\"state\":\"ready\"}");

  service->start();

  // Advertising compatible con tu versión (sin setScanResponse(true))
  NimBLEAdvertising* adv = NimBLEDevice::getAdvertising();
  adv->addServiceUUID(SERVICE_UUID);

  NimBLEAdvertisementData advData;
  advData.setName(bleName.c_str());
  advData.setCompleteServices(NimBLEUUID(SERVICE_UUID));
  adv->setAdvertisementData(advData);

  NimBLEAdvertisementData scanData;
  scanData.setName(bleName.c_str());
  adv->setScanResponseData(scanData);

  adv->start();

  Serial.println("BLE listo. Anunciando servicio...");
}

void loop() {
  delay(50);
}
