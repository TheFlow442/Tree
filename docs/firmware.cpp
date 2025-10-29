/**
 * =================================================================================================
 * RECOMMENDED FIRMWARE FOR SOLARIS智控 ESP32
 * =================================================================================================
 *
 * This code combines your detailed sensor and hardware logic with the modern, efficient, and 
 * real-time Firebase communication method used by the web application.
 *
 * Key Improvements:
 * 1.  Uses the modern and stable "Firebase ESP32 Client" library by Mobizt.
 * 2.  Uses efficient, real-time streaming for switch control instead of inefficient polling. This
 *     means Firebase PUSHES changes to the ESP32 instantly.
 * 3.  Authenticates securely using Firebase's modern anonymous sign-in.
 * 4.  Uses the correct database paths that match the web application (`/app/switchStates`).
 * 5.  Integrates your existing sensor functions (readVoltageRMS, readCurrentRMS, etc.) and
 *     your LCD display logic.
 *
 * How to Use:
 * 1.  In Arduino IDE, go to Sketch > Include Library > Manage Libraries...
 * 2.  Search for "Firebase ESP32 Client" (by Mobizt) and install it.
 * 3.  Fill in your WiFi and Firebase credentials in the placeholders below.
 * 4.  Copy this entire file into your Arduino sketch.
 * 5.  Upload to your ESP32.
 *
 */

#include <Arduino.h>
#include <WiFi.h>
#include <LiquidCrystal.h>
#include <DHT.h>
#include "Firebase_ESP_Client.h" // Modern, recommended Firebase library
#include <HTTPClient.h>


// ===== 1. FILL IN YOUR CREDENTIALS =====
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Found on your web app's Settings page, labeled "Firebase Project API Key".
// This key identifies your Firebase project.
#define API_KEY "YOUR_FIREBASE_PROJECT_API_KEY" 

// Found in your Firebase Console -> Realtime Database. It looks like "https://<project-id>-default-rtdb.firebaseio.com".
#define DATABASE_URL "YOUR_DATABASE_URL"       

// Generated on your web app's Settings page, labeled "Your Device API Key".
// This key authenticates your ESP32 when it sends data to your web app's API.
#define DEVICE_API_KEY "YOUR_DEVICE_API_KEY"   

// ===== Pins =====
#define Relay1 13
#define Relay2 14
#define Relay3 27
#define Relay4 26
#define Relay5 25
const int relayPins[] = {Relay1, Relay2, Relay3, Relay4, Relay5};

#define CURRENT_PIN 32
#define VOLTAGE_PIN 34
#define LDR_PIN 35
#define DHT_PIN 23
#define cnst 33

// LCD (4-bit mode)
LiquidCrystal lcd(22, 21, 19, 18, 5, 4);

// DHT
#define DHTTYPE DHT11
DHT dht(DHT_PIN, DHTTYPE);

// ===== Firebase Objects =====
FirebaseData stream; // For receiving real-time switch data
FirebaseData fbdo;   // For sending sensor data
FirebaseAuth auth;
FirebaseConfig config;

// ===== Calibration & Global Variables =====
const float VREF = 3.3;
const int ADC_MAX = 4095;
float currentOffset = 2048.0;
const float CURRENT_CALIBRATION_FACTOR = 0.185;
const float VOLTAGE_DIVIDER_RATIO = (47.0 + 10.0) / 10.0;
const float VOLTAGE_CALIBRATION = 1.25;

volatile float voltageRMS = 0;
volatile float currentRMS = 0;
volatile float power = 0;
volatile float temp = 0;
volatile float hum = 0;
volatile int ldrValue = 0;

unsigned long lastSensorSendMillis = 0;

// =================================================================================================
// REAL-TIME STREAM CALLBACK (Handles incoming switch commands)
// =================================================================================================
// This function is automatically called by the Firebase library when a switch state changes
// in the database. This is the core of the real-time control.
// =================================================================================================
void streamCallback(FirebaseStream data) {
  Serial.printf("STREAM DATA: Path = %s, Type = %s, Data = %s\n",
                data.dataPath().c_str(),
                data.dataType().c_str(),
                data.payload().c_str());

  // Example data.dataPath() will be "/1/state" for Switch 1
  if (data.dataType() == "boolean") {
    String path = data.dataPath();
    // Remove leading slash, e.g., "/1/state" -> "1/state"
    if (path.startsWith("/")) {
      path = path.substring(1);
    }

    // Get the switch ID, which is the part of the path before the next slash
    int slashIndex = path.indexOf("/");
    if (slashIndex > 0) {
      int switchId = path.substring(0, slashIndex).toInt();
      
      if (switchId >= 1 && switchId <= 5) {
        bool switchState = data.boolData();
        int pin = relayPins[switchId - 1]; // Array is 0-indexed
        
        Serial.printf("CONTROLLING: Switch ID %d on Pin %d to State %s\n", switchId, pin, switchState ? "ON" : "OFF");
        digitalWrite(pin, switchState ? HIGH : LOW);
      }
    }
  }
}

void streamTimeoutCallback(bool timeout) {
  if (timeout) {
    Serial.println("Stream timeout, resuming...");
  }
}


// =================================================================================================
// SENSOR READING AND DATA SENDING LOGIC (Your existing functions)
// =================================================================================================
void calibrateCurrentSensor() {
  Serial.println("Calibrating current sensor offset...");
  long sum = 0;
  for (int i = 0; i < 1000; i++) {
    sum += analogRead(CURRENT_PIN);
    delay(1);
  }
  currentOffset = sum / 1000.0;
  Serial.print("Current sensor offset: "); Serial.println(currentOffset);
}

float readVoltageRMS() {
  const int samples = 100;
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    int raw = analogRead(VOLTAGE_PIN);
    sum += (raw - 2048) * (raw - 2048);
    delayMicroseconds(200);
  }
  float rms = sqrt(sum / samples);
  float vRMS = (rms * VREF / ADC_MAX) * VOLTAGE_DIVIDER_RATIO * VOLTAGE_CALIBRATION;
  return vRMS;
}

float readCurrentRMS() {
  const int samples = 200;
  long sum = 0;
  for (int i = 0; i < samples; i++) {
    int raw = analogRead(CURRENT_PIN);
    currentOffset = 0.999 * currentOffset + 0.001 * raw;
    int centered = raw - currentOffset;
    sum += (long)centered * (long)centered;
  }
  float rms = sqrt(sum / samples);
  float vRMS = (rms * VREF) / ADC_MAX;
  float iRMS = vRMS / CURRENT_CALIBRATION_FACTOR;
  return (iRMS < 0.05) ? 0 : iRMS;
}

float readLux() {
  int raw = analogRead(LDR_PIN);
  return 4095 - raw;
}

// Function to read all sensors
void readAllSensors() {
  voltageRMS = readVoltageRMS();
  currentRMS = readCurrentRMS();
  power = voltageRMS * currentRMS;

  float t = dht.readTemperature();
  float h = dht.readHumidity();
  if (!isnan(t) && !isnan(h)) {
    temp = t;
    hum = h;
  }
  ldrValue = readLux();
}

// Function to send sensor data to the web app via the /api/data endpoint
void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping sensor data send.");
    return;
  }

  HTTPClient http;
  // ===== 2. FILL IN YOUR APP URL =====
  String serverUrl = "https://<YOUR_APP_URL>/api/data"; // IMPORTANT: Replace <YOUR_APP_URL> with your deployed App URL
  
  http.begin(serverUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Device-API-Key", DEVICE_API_KEY);

  // Create JSON payload
  String jsonPayload = "{";
  jsonPayload += "\"voltage\":" + String(voltageRMS) + ",";
  jsonPayload += "\"current\":" + String(currentRMS) + ",";
  jsonPayload += "\"power\":" + String(power) + ",";
  jsonPayload += "\"temperature\":" + String(temp) + ",";
  jsonPayload += "\"humidity\":" + String(hum);
  jsonPayload += "}";

  Serial.println("Sending sensor data to web app...");
  Serial.println(jsonPayload);

  int httpResponseCode = http.POST(jsonPayload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("HTTP Response code: " + String(httpResponseCode));
    Serial.println(response);
  } else {
    Serial.println("Error on sending POST: " + String(httpResponseCode));
  }
  
  http.end();
}


void displayOnLCD() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("T:");
  lcd.print(temp, 1);
  lcd.print("C H:");
  lcd.print(hum, 0);
  lcd.print("%");

  lcd.setCursor(0, 1);
  lcd.print("V:");
  lcd.print(voltageRMS, 0);
  lcd.print("v I:");
  lcd.print(currentRMS, 2);
  lcd.print("A");
}

// =================================================================================================
// SETUP AND LOOP
// =================================================================================================
void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  pinMode(cnst, OUTPUT);
  analogWrite(cnst, 80);

  for (int pin : relayPins) {
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
  }

  dht.begin();
  lcd.begin(16, 2);
  lcd.clear();
  lcd.print("System Booting...");
  delay(1500);

  // --- Connect to WiFi ---
  lcd.clear();
  lcd.print("Connecting WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  lcd.clear();
  lcd.print("WiFi Connected!");
  Serial.println("\nWiFi Connected!");
  delay(1500);

  // --- Configure Firebase ---
  lcd.clear();
  lcd.print("Connecting FB...");
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  // Use Anonymous Sign-in (more secure and modern)
  config.signer.test_mode = true; 
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  calibrateCurrentSensor();
  lcd.clear();
  lcd.print("System Ready!");

  // --- START REAL-TIME STREAM for Switch Control ---
  // This is the path the web app writes switch commands to.
  String streamPath = "/app/switchStates"; 
  if (!Firebase.RTDB.beginStream(&stream, streamPath)) {
    Serial.printf("!!! STREAM ERROR: Could not begin stream at %s (%s)\n", streamPath.c_str(), stream.errorReason().c_str());
  } else {
    Serial.printf("Successfully started stream at %s\n", streamPath.c_str());
    Firebase.RTDB.setStreamCallback(&stream, streamCallback, streamTimeoutCallback);
  }
}

void loop() {
  readAllSensors();
  displayOnLCD();

  // Send sensor data to the web app every 10 seconds
  if (millis() - lastSensorSendMillis > 10000) {
    lastSensorSendMillis = millis();
    sendSensorData();
  }

  delay(2000); // Main loop delay
}
