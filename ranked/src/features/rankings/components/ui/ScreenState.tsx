import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type ScreenStateProps = {
  title?: string;
  message?: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
};

export function ScreenState({
  title,
  message,
  loading = false,
  actionLabel,
  onAction,
  compact = false,
}: ScreenStateProps) {
  return (
    <View
      style={[
        styles.container,
        compact && styles.compact,
      ]}
    >
      {loading && (
        <ActivityIndicator />
      )}

      {title && (
        <Text style={styles.title}>
          {title}
        </Text>
      )}

      {message && (
        <Text style={styles.message}>
          {message}
        </Text>
      )}

      {actionLabel && onAction && (
        <Pressable
          style={styles.button}
          onPress={onAction}
        >
          <Text style={styles.buttonText}>
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
  },

  compact: {
    paddingVertical: 80,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    opacity: 0.55,
  },

  button: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  buttonText: {
    fontWeight: "600",
  },
});