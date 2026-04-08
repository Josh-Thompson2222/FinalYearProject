import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, TextInput, Button, StyleSheet, ScrollView, View, Pressable } from "react-native";
import { API_BASE_URL } from "../config";

function newDose() {
  return { name: "", qty: "1" };
}

function fromApiDoseList(list) {
  // list is expected to be [{name, qty}, ...]
  if (!Array.isArray(list)) return [newDose()];
  if (list.length === 0) return [newDose()];
  return list.map((x) => ({
    name: typeof x?.name === "string" ? x.name : "",
    qty: String(x?.qty ?? 1),
  }));
}

function toApiDoseList(doses) {
  return (doses || [])
    .map((d) => ({
      name: (d.name || "").trim(),
      qty: Number(d.qty) || 1,
    }))
    .filter((d) => d.name.length > 0);
}

function pickMostRecent(list) {
  if (!Array.isArray(list) || list.length === 0) return null;
  const sorted = [...list].sort((a, b) => {
    const da = new Date(a.updated_at || a.created_at).getTime();
    const db = new Date(b.updated_at || b.created_at).getTime();
    return db - da;
  });
  return sorted[0];
}

function DoseListEditor({ title, doses, setDoses }) {
  function updateDose(index, patch) {
    setDoses((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }
  function addDose() {
    setDoses((prev) => [...prev, newDose()]);
  }
  function removeDose(index) {
    setDoses((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {doses.map((dose, idx) => (
        <View key={`${title}-${idx}`} style={styles.row}>
          <View style={{ flex: 1, gap: 6 }}>
            <TextInput
              style={styles.input}
              value={dose.name}
              onChangeText={(t) => updateDose(idx, { name: t })}
              placeholder="Tablet name (e.g. Bioflu)"
              placeholderTextColor="#6b7280"
            />
            <TextInput
              style={styles.input}
              value={dose.qty}
              onChangeText={(t) => updateDose(idx, { qty: t })}
              keyboardType="number-pad"
              placeholder="Qty"
              placeholderTextColor="#6b7280"
            />
          </View>

          <Pressable
            onPress={() => removeDose(idx)}
            style={({ pressed }) => [styles.removeBtn, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.removeBtnText}>Remove</Text>
          </Pressable>
        </View>
      ))}

      <Button title="+ Add tablet" onPress={addDose} />
    </View>
  );
}

export default function MyScheduleScreen({ token, navigation }) {
  const [schedule, setSchedule] = useState(null);
  const [warning, setWarning] = useState("");
  const [output, setOutput] = useState("");

  const [morningDoses, setMorningDoses] = useState([newDose()]);
  const [afternoonDoses, setAfternoonDoses] = useState([newDose()]);
  const [eveningDoses, setEveningDoses] = useState([newDose()]);

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

      setMorningDoses(fromApiDoseList(chosen.morning));
      setAfternoonDoses(fromApiDoseList(chosen.afternoon));
      setEveningDoses(fromApiDoseList(chosen.evening));

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

      const payload = {
        morning: toApiDoseList(morningDoses),
        afternoon: toApiDoseList(afternoonDoses),
        evening: toApiDoseList(eveningDoses),
      };

      setOutput("Updating schedule...");

      const res = await fetch(`${API_BASE_URL}/api/schedules/${schedule.id}/`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      setOutput(`Status: ${res.status}\n\n${text}`);

      if (res.ok) {
        await loadMySchedule();
      }
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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 14, paddingBottom: 12 }}>
          <Text style={styles.note}>Editing schedule id: {schedule.id}</Text>

          <DoseListEditor title="Morning" doses={morningDoses} setDoses={setMorningDoses} />
          <DoseListEditor title="Afternoon" doses={afternoonDoses} setDoses={setAfternoonDoses} />
          <DoseListEditor title="Evening" doses={eveningDoses} setDoses={setEveningDoses} />

          <View style={{ gap: 8 }}>
            <Button title="Update Schedule" onPress={updateMySchedule} />
            <Button title="Delete Schedule" onPress={deleteMySchedule} color="#b91c1c" />
          </View>
        </ScrollView>
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

  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },

  row: { flexDirection: "row", gap: 10, alignItems: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    color: "#111827",
  },

  removeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef4444",
    alignSelf: "stretch",
    justifyContent: "center",
  },
  removeBtnText: { color: "#b91c1c", fontWeight: "600" },

  output: {
    minHeight: 70,
    maxHeight: 140,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 10,
  },
  outputText: { color: "#111827" },
});