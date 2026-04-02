import React, { useState } from "react";
import { SafeAreaView, Text, TextInput, Button, ScrollView, StyleSheet, View } from "react-native";
import { API_BASE_URL } from "../config";

export default function AuthScreen({ navigation, setToken }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [output, setOutput] = useState("");

  async function registerUser() {
    try {
      setOutput("Registering...");
      const res = await fetch(`${API_BASE_URL}/api/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const text = await res.text();
      setOutput(text);
    } catch (err) {
      setOutput(String(err));
    }
  }

  async function loginUser() {
    try {
      setOutput("Logging in...");

      const body = new URLSearchParams();
      body.append("username", email);
      body.append("password", password);

      const res = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      const data = await res.json();
      setToken(data.access_token);
      setOutput(JSON.stringify(data, null, 2));

      // Optional: go back home after login
      navigation.navigate("Home");
    } catch (err) {
      setOutput(String(err));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Login or Sign Up</Text>

      <Text style={styles.label}>Name (Only required for first-time registration)</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="#6b7280" />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="email" placeholderTextColor="#6b7280" />

      <Text style={styles.label}>Password</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry placeholder="password" placeholderTextColor="#6b7280" />

      <View style={{ gap: 8 }}>
        <Button title="Register" onPress={registerUser} />
        <Button title="Login" onPress={loginUser} />
      </View>

      {/* <Text style={styles.label}>Response</Text>
      <ScrollView style={styles.output}>
        <Text selectable style={styles.outputText}>{output}</Text>
      </ScrollView> */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 20 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", textAlign: "center", marginBottom: 60, marginTop: 20 },
  label: { fontWeight: "600", color: "#111827" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    color: "#111827",
  },
  output: { flex: 1, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10 },
  outputText: { color: "#111827" },
});