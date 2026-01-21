#include <WiFi.h>
#include <NimBLEDevice.h>

// ================= UUIDs BLE =================
static const char* SERVICE_UUID        = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
static const char* WIFI_CRED_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8"; // WRITE / WRITE_NR
static const char* STATUS_CHAR_UUID    = "caa1f2a0-9f7b-4d3f-b1d2-0d3c5f7c9a10"; // NOTIFY / READ

static NimBLECharacteristic* gStatusChar = nullptr;
static bool gDeviceConnected = false;

// ====== WiFi state machine (NO bloquear BLE) ======
enum WifiState {
  WIFI_IDLE,
  WIFI_STARTING,
  WIFI_CONNECTING,
  WIFI_CONNECTED,
  WIFI_FAILED
};

static volatile bool wifiConnectRequested = false;
static WifiState wifiState = WIFI_IDLE;

static String reqSsid = "";
static String reqPass = "";

static unsigned long wifiStartMs = 0;
static const unsigned long WIFI_TIMEOUT_MS = 30000;
static wl_status_t lastWifiStatus = WL_IDLE_STATUS;

// Forward declarations
static void notifyStatus(const String& json);
static void hardStopWiFi();
static bool extractJsonValue(const String& src, const String& key, String& out);
static void clearWiFiCredentials();

// ---------- BLE notify ----------
static void notifyStatus(const String& json) {
  if (gStatusChar && gDeviceConnected) {
    gStatusChar->setValue((uint8_t*)json.c_str(), json.length());
    gStatusChar->notify();
  }
}

// Parse simple de {"ssid":"X","pass":"Y"}
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

static void hardStopWiFi() {
  WiFi.disconnect(true, true);
  delay(150);
  WiFi.mode(WIFI_OFF);
  delay(150);
  WiFi.mode(WIFI_STA);
  delay(150);
}

// ---------- NimBLE callbacks ----------
class ServerCallbacks : public NimBLEServerCallbacks {
  void onConnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo) override {
    gDeviceConnected = true;
    notifyStatus("{\"type\":\"ble\",\"state\":\"connected\"}");
  }

  void onDisconnect(NimBLEServer* pServer, NimBLEConnInfo& connInfo, int reason) override {
    gDeviceConnected = false;
    NimBLEDevice::startAdvertising();
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
    if (!okPass) pass = "";

    // Guardar solicitud y procesar fuera del callback
    reqSsid = ssid;
    reqPass = pass;
    wifiConnectRequested = true;

    notifyStatus("{\"type\":\"wifi\",\"state\":\"received\"}");
  }
};

// ---------- WiFi state machine tick ----------
static void wifiTick() {
  // Si llega una nueva solicitud, la tomamos y reiniciamos el proceso
  if (wifiConnectRequested) {
    wifiConnectRequested = false;

    // Si estaba conectando, paramos limpio para evitar "cannot set config"
    hardStopWiFi();

    Serial.print("Connecting to SSID: ");
    Serial.println(reqSsid);

    notifyStatus("{\"type\":\"wifi\",\"state\":\"connecting\"}");

    WiFi.begin(reqSsid.c_str(), reqPass.c_str());

    wifiState = WIFI_CONNECTING;
    wifiStartMs = millis();
    lastWifiStatus = WL_IDLE_STATUS;
  }

  if (wifiState == WIFI_CONNECTING) {
    wl_status_t st = WiFi.status();

    if (st != lastWifiStatus) {
      lastWifiStatus = st;
      Serial.print("WiFi status changed: ");
      Serial.println((int)st);
    }

    if (st == WL_CONNECTED) {
      String ip = WiFi.localIP().toString();
      Serial.print("WiFi connected, IP: ");
      Serial.println(ip);

      notifyStatus("{\"type\":\"wifi\",\"state\":\"connected\",\"ip\":\"" + ip + "\"}");
      wifiState = WIFI_CONNECTED;
      return;
    }

    // Timeout
    if (millis() - wifiStartMs > WIFI_TIMEOUT_MS) {
      Serial.print("WiFi failed. status=");
      Serial.println((int)st);

      hardStopWiFi();
      notifyStatus("{\"type\":\"wifi\",\"state\":\"error\",\"reason\":\"timeout_or_auth\"}");
      wifiState = WIFI_FAILED;
      return;
    }
  }
}

// ---------- Setup / Loop ----------
void setup() {
  Serial.begin(115200);
  delay(200);

  WiFi.mode(WIFI_OFF);
  delay(200);

  String bleName = "Teddy-ESP32";

  NimBLEDevice::init(bleName.c_str());
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);

  NimBLEServer* server = NimBLEDevice::createServer();
  server->setCallbacks(new ServerCallbacks());

  NimBLEService* service = server->createService(SERVICE_UUID);

  NimBLECharacteristic* wifiCredChar = service->createCharacteristic(
    WIFI_CRED_CHAR_UUID,
    NIMBLE_PROPERTY::WRITE | NIMBLE_PROPERTY::WRITE_NR
  );
  wifiCredChar->setCallbacks(new WifiCredCallbacks());

  gStatusChar = service->createCharacteristic(
    STATUS_CHAR_UUID,
    NIMBLE_PROPERTY::NOTIFY | NIMBLE_PROPERTY::READ
  );
  gStatusChar->setValue("{\"type\":\"boot\",\"state\":\"ready\"}");

  service->start();

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
  wifiTick();      // <-- importante: procesa WiFi sin bloquear BLE
  delay(20);

  if (Serial.available()) {
    char c = Serial.read();
    if (c == 'R') {
      clearWiFiCredentials();
      Serial.println("WiFi reset done");
      ESP.restart();
    }
  }
}

static void clearWiFiCredentials() {
  Serial.println("Clearing WiFi credentials...");
  WiFi.disconnect(true, true);
  delay(300);
  WiFi.mode(WIFI_OFF);
  delay(300);
  WiFi.mode(WIFI_STA);
  delay(300);
}
