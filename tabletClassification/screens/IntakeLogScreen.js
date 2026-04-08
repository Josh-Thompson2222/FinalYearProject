// frontend/screens/IntakeLogScreen.js
import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, Button, StyleSheet, ScrollView, View } from "react-native";
import { API_BASE_URL } from "../config";

export default function IntakeLogScreen({ token }) {
  const [items, setItems] = useState([]);
  const [output, setOutput] = useState("");

  function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function fmtTime(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return iso;
    }
  }

  async function loadToday() {
    try {
      if (!token) {
        setOutput("Log in to view your intake log.");
        setItems([]);
        return;
      }

      setOutput("Loading today's intake log...");

      const res = await fetch(`${API_BASE_URL}/api/intake/today/`, {
        headers: authHeaders(),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(`Failed (${res.status}): ${text}`);

      const data = JSON.parse(text);
      setItems(Array.isArray(data) ? data : []);
      setOutput(`Loaded ${Array.isArray(data) ? data.length : 0} log entries.`);
    } catch (err) {
      setOutput(String(err));
    }
  }

  useEffect(() => {
    loadToday();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Button title="Refresh" onPress={loadToday} />

      <Text style={styles.title}>Today</Text>

      <ScrollView style={styles.list}>
        {items.length === 0 ? (
          <Text style={styles.empty}>No intake logged today.</Text>
        ) : (
          items.map((it) => (
            <View key={it.id} style={styles.card}>
              <Text style={styles.name}>{it.tablet_name}</Text>
              <Text style={styles.meta}>
                {String(it.time_of_day).toUpperCase()} • qty {it.qty_taken} • {fmtTime(it.taken_at)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <Text style={styles.label}>Status</Text>
      <ScrollView style={styles.output}>
        <Text selectable>{output}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 12 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  list: { flex: 1 },
  empty: { color: "#6b7280" },
  card: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 12, marginBottom: 10, backgroundColor: "#fff" },
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  meta: { marginTop: 4, color: "#374151" },
  label: { fontWeight: "600", color: "#111827" },
  output: { maxHeight: 120, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10 },
});