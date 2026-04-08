import React, { useMemo, useState } from "react";
import { SafeAreaView, Text, Button, StyleSheet, Image, ScrollView, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { API_BASE_URL } from "../config";

function normalizeName(s) {
  return String(s || "").trim().toLowerCase();
}

// Returns unique tablet names (display form) from schedule
function flattenScheduleNames(schedule) {
  if (!schedule) return [];
  const all = [
    ...((schedule.morning || []).map((x) => x?.name)),
    ...((schedule.afternoon || []).map((x) => x?.name)),
    ...((schedule.evening || []).map((x) => x?.name)),
  ];

  return Array.from(
    new Set(
      all
        .map((s) => (typeof s === "string" ? s.trim() : ""))
        .filter(Boolean)
    )
  );
}

// Build list of all scheduled rows with time-of-day + qty for display
function listAllScheduled(schedule) {
  const rows = [];
  const push = (timeOfDay, items) => {
    (items || []).forEach((it) => {
      const name = typeof it?.name === "string" ? it.name.trim() : "";
      if (!name) return;
      const qty = Number(it?.qty) || 1;
      rows.push({ timeOfDay, name, qty });
    });
  };

  push("Morning", schedule?.morning);
  push("Afternoon", schedule?.afternoon);
  push("Evening", schedule?.evening);

  return rows;
}

// Find all matches for the predicted tablet in the schedule (supports appearing multiple times)
function findMatches(schedule, predictedClass) {
  const target = normalizeName(predictedClass);
  const hits = [];

  const scan = (timeOfDay, items) => {
    (items || []).forEach((it) => {
      const name = typeof it?.name === "string" ? it.name.trim() : "";
      if (!name) return;
      if (normalizeName(name) !== target) return;

      const qty = Number(it?.qty) || 1;
      hits.push({ timeOfDay, qty });
    });
  };

  scan("Morning", schedule?.morning);
  scan("Afternoon", schedule?.afternoon);
  scan("Evening", schedule?.evening);

  return hits;
}

export default function PredictionScreen({ token }) {
  const [imageUri, setImageUri] = useState(null);

  const [predResult, setPredResult] = useState(null); // JSON from /api/predict
  const [schedule, setSchedule] = useState(null); // chosen schedule from /api/schedules/me/
  const [output, setOutput] = useState("");

  // NEW: matched times/qty for the last comparison
  const [matches, setMatches] = useState([]); // [{ timeOfDay: "Evening", qty: 4 }, ...]
  const [loggingTaken, setLoggingTaken] = useState(false);

  const scheduledNames = useMemo(() => flattenScheduleNames(schedule), [schedule]);

  function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function takePhoto() {
    setOutput("");
    setPredResult(null);
    setMatches([]);

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      setOutput("Camera permission denied. Use 'Pick from Photos' instead.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled) return;
    setImageUri(result.assets[0].uri);
  }

  async function pickFromPhotos() {
    setOutput("");
    setPredResult(null);
    setMatches([]);

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setOutput("Photo library permission denied.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return;
    setImageUri(result.assets[0].uri);
  }

  async function loadMySchedule() {
    const res = await fetch(`${API_BASE_URL}/api/schedules/me/`, {
      headers: authHeaders(),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Failed to load schedule (${res.status}): ${text}`);
    }

    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) return null;

    const sorted = [...list].sort((a, b) => {
      const da = new Date(a.updated_at || a.created_at).getTime();
      const db = new Date(b.updated_at || b.created_at).getTime();
      return db - da;
    });

    return sorted[0];
  }

  // NEW: log intake
  async function markAsTaken(timeOfDay, qty) {
    try {
      if (!token) {
        setOutput("You must be logged in to mark tablets as taken.");
        return;
      }
      if (!predResult?.predicted_class) {
        setOutput("No prediction result available.");
        return;
      }

      setLoggingTaken(true);

      const payload = {
        tablet_name: predResult.predicted_class,
        time_of_day: String(timeOfDay || "").toLowerCase(), // "morning"/"afternoon"/"evening"
        qty_taken: Number(qty) || 1,
      };

      const res = await fetch(`${API_BASE_URL}/api/intake/`, {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        throw new Error(`Mark as taken failed (${res.status}): ${text}`);
      }

      setOutput((prev) =>
        [
          prev,
          "",
          `Logged taken: ${payload.tablet_name} — ${timeOfDay} (qty ${payload.qty_taken})`,
        ].join("\n")
      );

      // Optional: prevent repeated taps in same session
      // setMatches([]);
    } catch (err) {
      setOutput(String(err));
    } finally {
      setLoggingTaken(false);
    }
  }

  async function submitPredictionAndCompare() {
    try {
      if (!imageUri) {
        setOutput("Select an image first.");
        return;
      }

      setMatches([]);
      setOutput("Uploading image for prediction...");

      // 1) Predict
      const form = new FormData();
      form.append("file", {
        uri: imageUri,
        name: "tablet.jpg",
        type: "image/jpeg",
      });

      const predRes = await fetch(`${API_BASE_URL}/api/predict`, {
        method: "POST",
        body: form,
      });

      const predText = await predRes.text();
      if (!predRes.ok) {
        setPredResult(null);
        setOutput(`Predict failed (${predRes.status}):\n${predText}`);
        return;
      }

      const predJson = JSON.parse(predText);
      setPredResult(predJson);

      // 2) Load schedule
      setOutput("Prediction done. Loading your schedule to compare...");
      const sched = await loadMySchedule();
      setSchedule(sched);

      if (!sched) {
        setMatches([]);
        setOutput(
          `Prediction: ${predJson.predicted_class} (${(predJson.confidence * 100).toFixed(1)}%)\n\nNo schedule found. Create a schedule first.`
        );
        return;
      }

      // 3) Compare + build time-of-day / qty info
      const hits = findMatches(sched, predJson.predicted_class);
      setMatches(hits);

      const isMatch = hits.length > 0;

      const allRows = listAllScheduled(sched);
      const allLines =
        allRows.length === 0
          ? ["(none)"]
          : allRows.map((r) => `- ${r.name} — ${r.timeOfDay} (qty ${r.qty})`);

      const hitLine = hits.map((h) => `${h.timeOfDay} (qty ${h.qty})`).join(", ");

      setOutput(
        [
          `Prediction: ${predJson.predicted_class} (${(predJson.confidence * 100).toFixed(1)}%)`,
          "",
          `In your schedule: ${isMatch ? "YES (match)" : "NO (not found)"}`,
          ...(isMatch ? [`Scheduled time(s): ${hitLine}`] : []),
          "",
          `Your scheduled tablets:`,
          ...allLines,
        ].join("\n")
      );
    } catch (err) {
      setOutput(String(err));
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Predict Tablet</Text>

      <View style={styles.row}>
        <Button title="Open Camera" onPress={takePhoto} />
        <Button title="Pick from Photos" onPress={pickFromPhotos} />
      </View>

      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.preview} />
      ) : (
        <Text style={styles.note}>No image selected yet.</Text>
      )}

      <Button title="Predict & Compare to My Schedule" onPress={submitPredictionAndCompare} disabled={!imageUri} />

      {/* NEW: Mark as taken buttons */}
      {matches.length > 0 ? (
        <View style={{ gap: 8 }}>
          <Text style={styles.label}>Mark as taken</Text>
          {matches.map((m, idx) => (
            <Button
              key={`${m.timeOfDay}-${idx}`}
              title={`Mark ${m.timeOfDay} taken (qty ${m.qty})`}
              onPress={() => markAsTaken(m.timeOfDay, m.qty)}
              disabled={loggingTaken}
            />
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>Status</Text>
      <ScrollView style={styles.output}>
        <Text selectable style={styles.outputText}>{output}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", textAlign: "center" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  preview: { width: "100%", height: 260, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  note: { color: "#374151" },
  label: { fontWeight: "600", color: "#111827" },
  output: { minHeight: 80, maxHeight: 220, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10 },
  outputText: { color: "#111827" },
});