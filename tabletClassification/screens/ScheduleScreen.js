import React from "react";
import { SafeAreaView, Button, StyleSheet, View, Text } from "react-native";

export default function ScheduleScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>You can create a new schedule or view and edit your existing one.</Text>
      <Text style={styles.description}>You can only create a new schedule if you don't already have one. If you do, you can view and edit it by clicking the "View / Edit My Schedule" button.</Text>
      
      <View style={styles.group}>
        <Button title="Create Schedule" onPress={() => navigation.navigate("CreateSchedule")} />
        <Button title="View / Edit My Schedule" onPress={() => navigation.navigate("MySchedule")} />
        <Button title="Back to Home" onPress={() => navigation.getParent()?.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff", gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", textAlign: "center", marginTop: 20 },
  description: { color: "#374151", textAlign: "center", marginBottom: 50 },
  group: { gap: 12 },
});