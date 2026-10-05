import { useState } from "react";
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";

type AuthMode =
  | "signIn"
  | "signUp";

type ValidationErrors = {
  email?: string;
  password?: string;
  submit?: string;
};

export function AuthScreen() {
  const [mode, setMode] =
    useState<AuthMode>("signIn");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [isPending, setIsPending] =
    useState(false);

  const [errors, setErrors] =
    useState<ValidationErrors>({});

  const [message, setMessage] =
    useState<string | null>(null);

  function clearError(
    field: keyof ValidationErrors
  ) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function validateForm() {
    const nextErrors: ValidationErrors =
      {};

    const cleanEmail =
      email.trim();

    if (!cleanEmail) {
      nextErrors.email =
        "Enter your email.";
    } else if (
      !cleanEmail.includes("@")
    ) {
      nextErrors.email =
        "Enter a valid email.";
    }

    if (!password) {
      nextErrors.password =
        "Enter your password.";
    } else if (
      password.length < 6
    ) {
      nextErrors.password =
        "Password must be at least 6 characters.";
    }

    return nextErrors;
  }

  async function handleSubmit() {
    const validationErrors =
      validateForm();

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setErrors(
        validationErrors
      );

      return;
    }

    setErrors({});
    setMessage(null);
    setIsPending(true);

    try {
      if (mode === "signIn") {
        const { error } =
          await supabase.auth
            .signInWithPassword({
              email: email.trim(),
              password,
            });

        if (error) {
          throw error;
        }
      } else {
        const {
          data,
          error,
        } =
          await supabase.auth.signUp({
            email: email.trim(),
            password,
          });

        if (error) {
          throw error;
        }

        if (!data.session) {
          setMessage(
            "Check your email to confirm your account."
          );
        }
      }
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      });
    } finally {
      setIsPending(false);
    }
  }

  function changeMode(
    nextMode: AuthMode
  ) {
    setMode(nextMode);
    setErrors({});
    setMessage(null);
  }

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
      accessible={false}
    >
      <View style={styles.container}>
        <View>
          <Text style={styles.brand}>
            Ranked
          </Text>

          <Text style={styles.subtitle}>
            {mode === "signIn"
              ? "Welcome back."
              : "Create your account."}
          </Text>
        </View>

        <View style={styles.modeSelector}>
          <Pressable
            style={[
              styles.modeButton,
              mode === "signIn" &&
                styles.selectedMode,
            ]}
            onPress={() =>
              changeMode("signIn")
            }
          >
            <Text
              style={[
                styles.modeText,
                mode === "signIn" &&
                  styles.selectedModeText,
              ]}
            >
              Sign In
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.modeButton,
              mode === "signUp" &&
                styles.selectedMode,
            ]}
            onPress={() =>
              changeMode("signUp")
            }
          >
            <Text
              style={[
                styles.modeText,
                mode === "signUp" &&
                  styles.selectedModeText,
              ]}
            >
              Sign Up
            </Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Email
          </Text>

          <TextInput
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              clearError("email");
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            style={[
              styles.input,
              errors.email &&
                styles.inputError,
            ]}
          />

          {errors.email && (
            <Text
              style={styles.errorText}
            >
              {errors.email}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>
            Password
          </Text>

          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              clearError(
                "password"
              );
            }}
            secureTextEntry
            placeholder="Password"
            style={[
              styles.input,
              errors.password &&
                styles.inputError,
            ]}
          />

          {errors.password && (
            <Text
              style={styles.errorText}
            >
              {errors.password}
            </Text>
          )}
        </View>

        {errors.submit && (
          <View
            style={styles.errorBox}
          >
            <Text
              style={
                styles.errorBoxText
              }
            >
              {errors.submit}
            </Text>
          </View>
        )}

        {message && (
          <View
            style={styles.messageBox}
          >
            <Text
              style={
                styles.messageText
              }
            >
              {message}
            </Text>
          </View>
        )}

        <Pressable
          style={[
            styles.submitButton,
            isPending &&
              styles.disabledButton,
          ]}
          disabled={isPending}
          onPress={handleSubmit}
        >
          <Text
            style={styles.submitText}
          >
            {isPending
              ? "Please wait..."
              : mode === "signIn"
                ? "Sign In"
                : "Create Account"}
          </Text>
        </Pressable>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      padding: 28,
      gap: 24,
    },

    brand: {
      fontSize: 40,
      fontWeight: "800",
    },

    subtitle: {
      marginTop: 6,
      fontSize: 17,
      opacity: 0.55,
    },

    modeSelector: {
      flexDirection: "row",
      padding: 4,
      borderRadius: 12,
      backgroundColor: "#EEEEEE",
    },

    modeButton: {
      flex: 1,
      padding: 10,
      borderRadius: 9,
      alignItems: "center",
    },

    selectedMode: {
      backgroundColor: "black",
    },

    modeText: {
      fontWeight: "600",
    },

    selectedModeText: {
      color: "white",
    },

    field: {
      gap: 8,
    },

    label: {
      fontSize: 15,
      fontWeight: "600",
    },

    input: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 17,
    },

    inputError: {
      borderColor: "#D92D20",
    },

    errorText: {
      color: "#D92D20",
      fontSize: 13,
    },

    errorBox: {
      padding: 14,
      borderRadius: 10,
      backgroundColor: "#FEE4E2",
    },

    errorBoxText: {
      color: "#B42318",
      fontSize: 14,
    },

    messageBox: {
      padding: 14,
      borderRadius: 10,
      backgroundColor: "#E8F5E9",
    },

    messageText: {
      fontSize: 14,
    },

    submitButton: {
      padding: 16,
      borderRadius: 12,
      backgroundColor: "black",
    },

    disabledButton: {
      opacity: 0.5,
    },

    submitText: {
      color: "white",
      textAlign: "center",
      fontWeight: "600",
    },
  });