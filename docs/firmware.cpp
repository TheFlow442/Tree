/**
 * =================================================================================================
 * SIMPLE WIFI CONNECTION TEST FOR ESP32
 * =================================================================================================
 *
 * This is a minimal sketch to test if your ESP32 can connect to your WiFi network.
 * It will print the connection status to the Serial Monitor.
 *
 * How to Use:
 * 1.  Fill in your WiFi credentials below if they are different.
 * 2.  Upload this code to your ESP32.
 * 3.  Open the Arduino IDE's Serial Monitor (set to 115200 baud).
 * 4.  Check the output to see if the connection is successful.
 *
 */

#include <Arduino.h>
#include <WiFi.h>

// ===== 1. FILL IN YOUR CREDENTIALS =====
const char* ssid = "Energy";
const char* password = "managementl";

void setup() {
  // Start the Serial Monitor to see output
  Serial.begin(115200);
  delay(100); 

  Serial.println();
  Serial.print("Connecting to WiFi network: ");
  Serial.println(ssid);

  // Set WiFi to station mode and begin connection
  // This is a more reliable way to start the connection
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  delay(500);

  // Wait for connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // The loop is empty as we only need to connect once in setup.
  delay(10000); 
}
