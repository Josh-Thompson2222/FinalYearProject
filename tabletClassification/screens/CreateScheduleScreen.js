import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, TextInput, Button, StyleSheet, ScrollView, View } from "react-native";
import { API_BASE_URL } from "../config";

export default function CreateScheduleScreen({ token, navigation }) {
  const [morning, setMorning] = useState("");
  const [afternoon, setAfternoon] = useState("");
  const [evening, setEvening] = useState("");

  const [hasSchedule, setHasSchedule] = useState(false);
  const [output, setOutput] = useState("");

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  async function checkIfScheduleExists() {
    try {
      const res = await fetch(`${API_BASE_URL}/api/schedules/me/`, { headers: authHeaders() });
      const data = await res.json();
      const exists = Array.isArray(data) && data.length > 0;
      setHasSchedule(exists);

      if (exists) {
        setOutput("You already have a schedule. Go to 'View / Edit My Schedule' to update or delete it.");
      } else {
        setOutput("No schedule found. You can create one now.");
      }
    } catch (err) {
      setOutput(String(err));
    }
  }

  async function createSchedule() {
    try {
      if (hasSchedule) {
        setOutput("Cannot create: you already have a schedule. Please update/delete it instead.");
        return;
      }

      setOutput("Creating schedule...");

      const payload = {
        morning: morning ? [morning] : [],
        afternoon: afternoon ? [afternoon] : [],
        evening: evening ? [evening] : [],
      };

      const res = await fetch(`${API_BASE_URL}/api/schedules/`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      setOutput(`Status: ${res.status}\n\n${text}`);

      if (res.ok) {
        navigation.navigate("MySchedule");
      }
    } catch (err) {
      setOutput(String(err));
    }
  }

  useEffect(() => {
    checkIfScheduleExists();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {hasSchedule ? (
        <View style={{ gap: 10 }}>
          <Text style={styles.note}>
            You already have a schedule. Creation is disabled so you only have one schedule at a time.
          </Text>
          <Button title="Go to View / Edit" onPress={() => navigation.navigate("MySchedule")} />
        </View>
      ) : (
        <>
          <Text style={styles.label}>Morning (single tablet name)</Text>
          <TextInput style={styles.input} value={morning} onChangeText={setMorning} />

          <Text style={styles.label}>Afternoon</Text>
          <TextInput style={styles.input} value={afternoon} onChangeText={setAfternoon} />

          <Text style={styles.label}>Evening</Text>
          <TextInput style={styles.input} value={evening} onChangeText={setEvening} />

          <Button title="Create Schedule" onPress={createSchedule} />
        </>
      )}

      <Text style={styles.label}>Status</Text>
      <ScrollView style={styles.output}>
        <Text selectable style={styles.outputText}>{output}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 10 },
  label: { fontWeight: "600", color: "#111827" },
  note: { color: "#374151" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, color: "#111827" },
  output: { minHeight: 80, maxHeight: 160, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10},
  outputText: { color: "#111827" },
});