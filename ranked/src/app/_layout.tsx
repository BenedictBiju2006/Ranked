import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AppProviders } from "@/providers/AppProviders";
import { useAuth } from "@/providers/AuthProvider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView
      style={{ flex: 1 }}
    >
      <AppProviders>
        <RootNavigator />
      </AppProviders>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const {
    session,
    isLoading,
  } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Protected
        guard={!session}
      >
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
          }}
        />
      </Stack.Protected>

      <Stack.Protected
        guard={!!session}
      >
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

        <Stack.Screen
          name="ranking/edit"
          options={{
            title: "Edit Ranking",
            presentation: "modal",
          }}
        />

        <Stack.Screen
          name="ranking/add-item"
          options={{
            title: "Add Item",
            presentation: "modal",
          }}
        />

        <Stack.Screen
          name="ranking/edit-item"
          options={{
            title: "Edit Item",
            presentation: "modal",
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}