import React, { useState } from "react";
import { SafeAreaView, Text, TextInput, Button, ScrollView, StyleSheet, View } from "react-native";
import { API_BASE_URL } from "../config";

export default function SchedulesScreen({ token }) {
  const [morning, setMorning] = useState("");
  const [afternoon, setAfternoon] = useState("");
  const [evening, setEvening] = useState("");
  const [deleteId, setDeleteId] = useState("");

  const [output, setOutput] = useState("");

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  async function createSchedule() {
  try {
    setOutput("Creating schedule...");
    const res = await fetch(`${API_BASE_URL}/api/schedules/`, {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({
        morning: morning ? [morning] : [],
        afternoon: afternoon ? [afternoon] : [],
        evening: evening ? [evening] : [],
      }),
    });
    const text = await res.text();
    setOutput(text);
  } catch (err) {
    setOutput(String(err));
  }
}

  async function loadMySchedules() {
    try {
      setOutput("Loading my schedules...");
      const res = await fetch(`${API_BASE_URL}/api/schedules/me/`, {
        headers: authHeaders(),
      });
      const text = await res.text();
      setOutput(text);
    } catch (err) {
      setOutput(String(err));
    }
  }

  async function deleteSchedule() {
    try {
      const id = Number(deleteId);
      if (!id) {
        setOutput("Enter a valid schedule id to delete.");
        return;
      }

      setOutput(`Deleting schedule ${id}...`);
      const res = await fetch(`${API_BASE_URL}/api/schedules/${id}/`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      // 204 No Content expected; but still safe to read text
      const text = await res.text();
      setOutput(`Delete status: ${res.status}\n${text || "(no body)"}\nNow reload schedules to confirm.`);
    } catch (err) {
      setOutput(String(err));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Schedules</Text>

      <Text style={styles.label}>Morning</Text>
      <TextInput style={styles.input} value={morning} onChangeText={setMorning} placeholderTextColor="#6b7280" />

      <Text style={styles.label}>Afternoon</Text>
      <TextInput style={styles.input} value={afternoon} onChangeText={setAfternoon} placeholderTextColor="#6b7280" />

      <Text style={styles.label}>Evening</Text>
      <TextInput style={styles.input} value={evening} onChangeText={setEvening} placeholderTextColor="#6b7280" />

      <View style={{ gap: 8 }}>
        <Button title="Create Schedule (POST)" onPress={createSchedule} />
        <Button title="Load My Schedules (GET)" onPress={loadMySchedules} />
      </View>

      <Text style={styles.label}>Delete Schedule by ID</Text>
      <TextInput
        style={styles.input}
        value={deleteId}
        onChangeText={setDeleteId}
        keyboardType="number-pad"
        placeholder="e.g. 1"
        placeholderTextColor="#6b7280"
      />
      <Button title="Delete (DELETE)" onPress={deleteSchedule} />
{/**/}
      <Text style={styles.label}>Response</Text>
      <ScrollView style={styles.output}>
        <Text selectable style={styles.outputText}>{output}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 10 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", textAlign: "center", marginBottom: 20 },
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