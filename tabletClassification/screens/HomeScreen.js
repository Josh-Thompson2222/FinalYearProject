import React from "react";
import { SafeAreaView, Text, Button, StyleSheet, View } from "react-native";

export default function HomeScreen({ navigation, token, setToken }) {
  function logout() {
    setToken(null);
    // optional: send them to Auth screen after logout
    // navigation.navigate("Auth");
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Tablet Image Classification</Text>

      <View style={styles.group}>
        <Button title="Login or Sign Up" onPress={() => navigation.navigate("Auth")} />

        <Button
          title="Schedules"
          onPress={() => navigation.navigate("Schedules")}
          disabled={!token}
        />

        {token ? <Button title="Logout" onPress={logout} color="#b91c1c" /> : null}
      </View>

      {!token ? (
        <Text style={styles.note}>Login first to use Schedules (JWT required).</Text>
      ) : (
        <Text style={styles.note}>Logged in (token present).</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", textAlign: "center" },
  group: { gap: 10 },
  note: { color: "#374151", fontStyle: "italic", textAlign: "center" },
});