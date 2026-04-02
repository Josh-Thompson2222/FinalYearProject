import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./screens/HomeScreen";
import AuthScreen from "./screens/AuthScreen";
import SchedulesScreen from "./screens/ScheduleScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [token, setToken] = useState(null);

  return (
    <NavigationContainer>
      <StatusBar style="dark" />

      <Stack.Navigator>
        <Stack.Screen name="Home" options={{ title: "Home" }}>
          {(props) => <HomeScreen {...props} token={token} setToken={setToken}/>}
        </Stack.Screen>

        <Stack.Screen name="Auth" options={{ title: "Authentication" }}>
          {(props) => <AuthScreen {...props} setToken={setToken} />}
        </Stack.Screen>

        <Stack.Screen name="Schedules" options={{ title: "Schedules" }}>
          {(props) => <SchedulesScreen {...props} token={token} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}