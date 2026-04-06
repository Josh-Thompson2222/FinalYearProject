import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, Text, TextInput, Button, StyleSheet, ScrollView, View } from "react-native";
import { API_BASE_URL } from "../config";

function pickMostRecent(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  // pick by updated_at if present, else created_at
  const sorted = [...list].sort((a, b) => {
    const da = new Date(a.updated_at || a.created_at).getTime();
    const db = new Date(b.updated_at || b.created_at).getTime();
    return db - da;
  });
  return sorted[0];
}

function listToText(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.join(", ");
}

function parseList(text) {
  // optional improvement: allow comma-separated values
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function MySchedule({ token, navigation }) {
  const [schedule, setSchedule] = useState(null);
  const [warning, setWarning] = useState("");
  const [output, setOutput] = useState("");

  // editable text fields (comma-separated for convenience)
  const [morning, setMorning] = useState("");
  const [afternoon, setAfternoon] = useState("");
  const [evening, setEvening] = useState("");

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  async function loadMySchedule() {
    try {
      setOutput("Loading your schedule...");
      setWarning("");

      const res = await fetch(`${API_BASE_URL}/api/schedules/me/`, { headers: authHeaders() });
      const list = await res.json();

      if (!Array.isArray(list) || list.length === 0) {
        setSchedule(null);
        setOutput("No schedule found. Create one first.");
        return;
      }

      const chosen = pickMostRecent(list);
      setSchedule(chosen);

      if (list.length > 1) {
        setWarning(`Warning: you have ${list.length} schedules in the DB. Showing the most recent (id=${chosen.id}).`);
      }

      // pre-fill inputs from schedule
      setMorning(listToText(chosen.morning));
      setAfternoon(listToText(chosen.afternoon));
      setEvening(listToText(chosen.evening));

      setOutput(`Loaded schedule id=${chosen.id}`);
    } catch (err) {
      setOutput(String(err));
    }
  }

  async function updateMySchedule() {
    try {
      if (!schedule) {
        setOutput("No schedule to update.");
        return;
      }

      // Build payload as Optional[List[str]] — only include fields (you can include all too)
      const payload = {
        morning: parseList(morning),
        afternoon: parseList(afternoon),
        evening: parseList(evening),
      };

      setOutput("Updating schedule...");
      const res = await fetch(`${API_BASE_URL}/api/schedules/${schedule.id}/`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      setOutput(`Status: ${res.status}\n\n${text}`);
      await loadMySchedule();
    } catch (err) {
      setOutput(String(err));
    }
  }

  async function deleteMySchedule() {
    try {
      if (!schedule) {
        setOutput("No schedule to delete.");
        return;
      }

      setOutput("Deleting schedule...");
      const res = await fetch(`${API_BASE_URL}/api/schedules/${schedule.id}/`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const text = await res.text();
      setOutput(`Delete status: ${res.status}\n${text || "(no body)"}`);

      // refresh
      setSchedule(null);
      await loadMySchedule();
    } catch (err) {
      setOutput(String(err));
    }
  }

  useEffect(() => {
    loadMySchedule();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ gap: 8 }}>
        <Button title="Refresh" onPress={loadMySchedule} />
        {!schedule ? (
          <Button title="Go to Create Schedule" onPress={() => navigation.navigate("CreateSchedule")} />
        ) : null}
      </View>

      {warning ? <Text style={styles.warning}>{warning}</Text> : null}

      {!schedule ? (
        <Text style={styles.note}>No schedule exists yet.</Text>
      ) : (
        <>
          <Text style={styles.note}>Editing schedule id: {schedule.id}</Text>

          <Text style={styles.label}>Morning (comma-separated)</Text>
          <TextInput style={styles.input} value={morning} onChangeText={setMorning} />

          <Text style={styles.label}>Afternoon (comma-separated)</Text>
          <TextInput style={styles.input} value={afternoon} onChangeText={setAfternoon} />

          <Text style={styles.label}>Evening (comma-separated)</Text>
          <TextInput style={styles.input} value={evening} onChangeText={setEvening} />

          <View style={{ gap: 8 }}>
            <Button title="Update Schedule" onPress={updateMySchedule} />
            <Button title="Delete Schedule" onPress={deleteMySchedule} color="#b91c1c" />
          </View>
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
  warning: { color: "#b45309" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10, color: "#111827" },
  output: { minHeight: 80, maxHeight: 160, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10},
  outputText: { color: "#111827" },
});