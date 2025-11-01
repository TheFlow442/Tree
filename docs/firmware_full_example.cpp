/**
 * =================================================================================================
 * SOLARIS - FULL ESP32 FIRMWARE EXAMPLE
 * =================================================================================================
 *
 * This sketch demonstrates a complete implementation for connecting an ESP32 to the Solaris
 * web application. It includes:
 * 1.  WiFi Connection.
 * 2.  Secure connection to Firebase Realtime Database using the Firebase-ESP32 library.
 * 3.  Listening for real-time changes to switch states from the web app.
 * 4.  Controlling GPIO pins (connected to relays/switches) based on database changes.
 * 5.  Reading sensor data (placeholder functions) and sending it to the web app.
 *
 * REQUIRED LIBRARIES:
 * - Arduino_JSON (by Arduino)
 * - Firebase ESP32 Client (by Mobizt) -> Search for "Firebase ESP32 Client" in Library Manager
 *
 * HOW TO USE:
 * 1.  Install the required libraries in your Arduino IDE.
 * 2.  Fill in your WiFi credentials.
 * 3.  Get your Firebase Project API Key and Device API Key from the Solaris app's Settings page.
 * 4.  Fill in your Firebase Host URL (from your Firebase project settings).
 * 5.  Define the GPIO pins your relays are connected to.
 * 6.  Implement the `readVoltage()`, `readCurrent()`, etc. functions with your actual sensor logic.
 * 7.  Upload to your ESP32.
 *
 */

#include <Arduino.h>
#include <WiFi.h>
#include <Firebase_ESP_Client.h>

// ===== 1. FILL IN YOUR WIFI CREDENTIALS =====
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ===== 2. FILL IN FROM SOLARIS SETTINGS PAGE =====
const char* FIREBASE_HOST = "https://smart-solar-agent-default-rtdb.firebaseio.com"; // Your Firebase RTDB URL
const char* FIREBASE_PROJECT_API_KEY = "YOUR_PROJECT_API_KEY"; // From Solaris Settings
const char* DEVICE_API_KEY = "YOUR_DEVICE_API_KEY"; // From Solaris Settings

// ===== 3. DEFINE YOUR SWITCH GPIO PINS =====
#define SWITCH_1_PIN 23
#define SWITCH_2_PIN 22
#define SWITCH_3_PIN 21
#define SWITCH_4_PIN 19
#define SWITCH_5_PIN 18

// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// Firebase stream object for listening to switch state changes
FirebaseData stream;

// Function to handle the stream data (switch state changes)
void streamCallback(StreamData data) {
  Serial.println("Stream data received!");
  Serial.printf("Stream path: %s\n", data.streamPath().c_str());
  Serial.printf("Data type: %s\n", data.dataType().c_str());

  if (data.dataType() == "json") {
    FirebaseJson* json = data.to<FirebaseJson*>();
    Serial.println(json->raw());
    
    // Example: path is /1/state, we want to get the parent path which is /1
    String switchIdStr = data.dataPath();
    switchIdStr.remove(0, 1); // remove leading '/'
    int switchId = switchIdStr.toInt();

    bool switchState = data.to<bool>();
    Serial.printf("Switch %d state changed to: %s\n", switchId, switchState ? "ON" : "OFF");

    int pin = -1;
    switch(switchId) {
      case 1: pin = SWITCH_1_PIN; break;
      case 2: pin = SWITCH_2_PIN; break;
      case 3: pin = SWITCH_3_PIN; break;
      case 4: pin = SWITCH_4_PIN; break;
      case 5: pin = SWITCH_5_PIN; break;
    }

    if (pin != -1) {
      digitalWrite(pin, switchState ? HIGH : LOW);
      Serial.printf("Toggled GPIO pin %d\n", pin);
    }
  } else {
     // The change could be on the root, lets parse the whole object
     if (data.dataType() == "json") {
        FirebaseJson* json = data.to<FirebaseJson*>();
        size_t len = json->iteratorBegin();
        FirebaseJson::IteratorValue value;
        for (size_t i = 0; i < len; i++) {
            value = json->valueAt(i);
            if (value.key == "1") {
               digitalWrite(SWITCH_1_PIN, value.value == "true" ? HIGH : LOW);
            }
             if (value.key == "2") {
               digitalWrite(SWITCH_2_PIN, value.value == "true" ? HIGH : LOW);
            }
            if (value.key == "3") {
               digitalWrite(SWITCH_3_PIN, value.value == "true" ? HIGH : LOW);
            }
             if (value.key == "4") {
               digitalWrite(SWITCH_4_PIN, value.value == "true" ? HIGH : LOW);
            }
             if (value.key == "5") {
               digitalWrite(SWITCH_5_PIN, value.value == "true" ? HIGH : LOW);
            }
        }
        json->iteratorEnd();
     }
  }
}

void streamTimeoutCallback(bool timeout) {
  if (timeout) {
    Serial.println("Stream timeout, resuming...");
  }
}

// Placeholder functions for sensor readings
float readVoltage() { return 230.0 + random(-5, 5); }
float readCurrent() { return 5.0 + random(-2, 2); }
float readBatteryLevel() { return 80.0 + random(-10, 10); }
float readPower() { return 1200.0 + random(-100, 100); }
float readTemperature() { return 25.0 + random(-2, 2); }
float readHumidity() { return 60.0 + random(-10, 10); }

void sendSensorData() {
  if (WiFi.status() == WL_CONNECTED && Firebase.ready()) {
    Serial.println("------------------------------------");
    Serial.println("Sending sensor data to web app...");

    // Construct the URL for the POST request
    String url = "/api/data";
    
    // Create a JSON object with sensor data
    FirebaseJson json;
    json.set("voltage", readVoltage());
    json.set("current", readCurrent());
    json.set("batteryLevel", readBatteryLevel());
    json.set("power", readPower());
    json.set("temperature", readTemperature());
    json.set("humidity", readHumidity());

    // Use Firebase's function to make a POST request with headers
    // This is a generic HTTP POST, not a Firebase DB specific one.
    // We can't use the built-in Firebase HTTP client as it doesn't support custom headers easily.
    // A standard HTTPClient approach is better here.
    
    HTTPClient http;
    String serverUrl = "YOUR_DEPLOYED_APP_URL" + url; // e.g. https://your-app.firebaseapp.com/api/data
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Device-API-Key", DEVICE_API_KEY);

    String jsonStr;
    json.toString(jsonStr, true); // pretty print for serial monitor
    Serial.println(jsonStr);

    int httpResponseCode = http.POST(jsonStr);

    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("HTTP Response code: " + String(httpResponseCode));
      Serial.println(response);
    } else {
      Serial.println("Error on sending POST: " + String(httpResponseCode));
    }

    http.end();
  }
}

void setup() {
  Serial.begin(115200);

  // Initialize GPIO pins for switches
  pinMode(SWITCH_1_PIN, OUTPUT);
  pinMode(SWITCH_2_PIN, OUTPUT);
  pinMode(SWITCH_3_PIN, OUTPUT);
  pinMode(SWITCH_4_PIN, OUTPUT);
  pinMode(SWITCH_5_PIN, OUTPUT);

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  // Configure Firebase
  config.api_key = FIREBASE_PROJECT_API_KEY;
  config.database_url = FIREBASE_HOST;

  // Sign in anonymously
  auth.user.email = "";
  auth.user.password = "";
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Set up stream for listening to switch state changes
  if (!Firebase.beginStream(stream, "/app/switchStates")) {
    Serial.printf("Could not begin stream: %s\n", stream.errorReason().c_str());
  }

  Firebase.setStreamCallback(stream, streamCallback, streamTimeoutCallback);

  Serial.println("Setup complete. Listening for switch changes and sending data every 30 seconds.");
}

unsigned long lastDataSend = 0;

void loop() {
  // Send sensor data every 30 seconds
  if (millis() - lastDataSend > 30000) {
    lastDataSend = millis();
    sendSensorData();
  }
}
