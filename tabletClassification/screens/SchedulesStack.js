import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SchedulesHomeScreen from "./SchedulesHomeScreen";
import CreateScheduleScreen from "./CreateScheduleScreen";
import MyScheduleScreen from "./MyScheduleScreen";

const Stack = createNativeStackNavigator();

export default function SchedulesStack({ token }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="SchedulesHome" options={{ title: "Schedules" }}>
        {(props) => <SchedulesHomeScreen {...props} />}
      </Stack.Screen>

      <Stack.Screen name="CreateSchedule" options={{ title: "Create Schedule" }}>
        {(props) => <CreateScheduleScreen {...props} token={token} />}
      </Stack.Screen>

      <Stack.Screen name="MySchedule" options={{ title: "My Schedule" }}>
        {(props) => <MyScheduleScreen {...props} token={token} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}