import { Stack } from "expo-router";

import { AppProviders } from "@/providers/AppProviders";

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="ranking/new"
          options={{
            title: "New Ranking",
            presentation: "modal",
          }}
        />

        <Stack.Screen
          name="ranking/[id]"
          options={{
            title: "Ranking",
          }}
        />
      </Stack>
    </AppProviders>
  );
}