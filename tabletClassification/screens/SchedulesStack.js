import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ScheduleScreen from "./ScheduleScreen";
import CreateScheduleScreen from "./CreateScheduleScreen";
import MySchedule from "./MyScheduleScreen";

const Stack = createNativeStackNavigator();

export default function SchedulesStack({ token }) {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Schedules" options={{ title: "Schedule" }}>
        {(props) => <ScheduleScreen {...props} />}
      </Stack.Screen>

      <Stack.Screen name="CreateSchedule" options={{ title: "Create Schedule" }}>
        {(props) => <CreateScheduleScreen {...props} token={token} />}
      </Stack.Screen>

      <Stack.Screen name="MySchedule" options={{ title: "My Schedule" }}>
        {(props) => <MySchedule {...props} token={token} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}