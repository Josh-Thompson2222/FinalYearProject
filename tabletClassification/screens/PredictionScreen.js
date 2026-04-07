import React, { useMemo, useState } from "react";
import { SafeAreaView, Text, Button, StyleSheet, Image, ScrollView, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { API_BASE_URL } from "../config";

function flattenScheduleNames(schedule) {
  if (!schedule) return [];
  const all = [
    ...(schedule.morning || []),
    ...(schedule.afternoon || []),
    ...(schedule.evening || []),
  ];
  // normalize + unique
  const normalized = all
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);
  return Array.from(new Set(normalized));
}

function normalizeName(s) {
  return String(s || "").trim().toLowerCase();
}

export default function PredictionScreen({ token }) {
  const [imageUri, setImageUri] = useState(null);

  const [predResult, setPredResult] = useState(null); // JSON from /api/predict
  const [schedule, setSchedule] = useState(null); // chosen schedule from /api/schedules/me/
  const [output, setOutput] = useState("");

  const scheduledNames = useMemo(() => flattenScheduleNames(schedule), [schedule]);

  function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function takePhoto() {
    setOutput("");
    setPredResult(null);

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
    // You said: only one schedule at a time, but endpoint returns a list.
    // We'll pick the most recent if multiple exist.
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

  async function submitPredictionAndCompare() {
    try {
      if (!imageUri) {
        setOutput("Select an image first.");
        return;
      }

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
        // IMPORTANT: don't set Content-Type manually for FormData in RN
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
        setOutput(
          `Prediction: ${predJson.predicted_class} (${(predJson.confidence * 100).toFixed(1)}%)\n\nNo schedule found. Create a schedule first.`
        );
        return;
      }

      // 3) Compare (case-insensitive)
      const predicted = normalizeName(predJson.predicted_class);
      const scheduleSet = new Set(flattenScheduleNames(sched).map(normalizeName));

      const isMatch = scheduleSet.has(predicted);

      setOutput(
        [
          `Prediction: ${predJson.predicted_class} (${(predJson.confidence * 100).toFixed(1)}%)`,
          "",
          `In your schedule: ${isMatch ? "YES (match)" : "NO (not found)"}`,
          "",
          `Your scheduled tablets:`,
          ...flattenScheduleNames(sched).map((n) => `- ${n}`),
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

      <Button
        title="Predict & Compare to My Schedule"
        onPress={submitPredictionAndCompare}
        disabled={!imageUri}
      />

      <Text style={styles.label}>Status</Text>
      <ScrollView style={styles.output}>
        <Text selectable style={styles.outputText}>{output}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  preview: {width: "100%", height: 260, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  note: { color: "#374151" },
  label: { fontWeight: "600", color: "#111827" },
  output: {minHeight: 80, maxHeight: 220, borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 10 },
  outputText: { color: "#111827" },
});