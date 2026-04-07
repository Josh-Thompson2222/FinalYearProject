import React, { useEffect, useState } from "react";
import { SafeAreaView, Text, TextInput, Button, StyleSheet, ScrollView, View, Pressable } from "react-native";
import { API_BASE_URL } from "../config";

function newDose() {
  return { name: "", qty: "1" }; // keep qty as string for TextInput
}

function toDoseItems(doses) {
  return doses
    .map((d) => ({
      name: (d.name || "").trim(),
      qty: Number(d.qty) || 1,
    }))
    .filter((d) => d.name.length > 0);
}

function DoseList({ title, doses, setDoses }) {
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

export default function CreateScheduleScreen({ token, navigation }) {
  const [morningDoses, setMorningDoses] = useState([newDose()]);
  const [afternoonDoses, setAfternoonDoses] = useState([newDose()]);
  const [eveningDoses, setEveningDoses] = useState([newDose()]);

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

      setOutput(
        exists
          ? "You already have a schedule. Go to 'View / Edit My Schedule' to update or delete it."
          : "No schedule found. You can create one now."
      );
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

      const payload = {
        morning: toDoseItems(morningDoses),
        afternoon: toDoseItems(afternoonDoses),
        evening: toDoseItems(eveningDoses),
      };

      // basic validation so users can't submit an empty schedule by accident
      if (payload.morning.length + payload.afternoon.length + payload.evening.length === 0) {
        setOutput("Please add at least one tablet before creating the schedule.");
        return;
      }

      setOutput("Creating schedule...");

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
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 14, paddingBottom: 12 }}>
            <DoseList title="Morning" doses={morningDoses} setDoses={setMorningDoses} />
            <DoseList title="Afternoon" doses={afternoonDoses} setDoses={setAfternoonDoses} />
            <DoseList title="Evening" doses={eveningDoses} setDoses={setEveningDoses} />

            <Button title="Create Schedule" onPress={createSchedule} />
          </ScrollView>
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