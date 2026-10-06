import { router } from "expo-router";
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

import { ScreenState } from "../components/ui/ScreenState";

import { useRanking } from "../hooks/useRankings";
import { useUpdateRanking } from "../hooks/useUpdateRanking";

type EditRankingScreenProps = {
  rankingId: string;
};

type ValidationErrors = {
  title?: string;
  description?: string;
  submit?: string;
};

export function EditRankingScreen({
  rankingId,
}: EditRankingScreenProps) {
  const {
    data: ranking,
    isPending,
    isError,
    refetch,
  } = useRanking(rankingId);

  if (isPending) {
    return (
      <ScreenState
        loading
        title="Loading ranking"
      />
    );
  }

  if (isError) {
    return (
      <ScreenState
        title="Couldn't load ranking"
        message="Check your connection and try again."
        actionLabel="Try Again"
        onAction={() => {
          void refetch();
        }}
      />
    );
  }

  if (!ranking) {
    return (
      <ScreenState
        title="Ranking not found"
        message="It may have been deleted."
      />
    );
  }

  return (
    <EditRankingForm
      rankingId={rankingId}
      initialTitle={ranking.title}
      initialDescription={
        ranking.description ?? ""
      }
    />
  );
}

type EditRankingFormProps = {
  rankingId: string;
  initialTitle: string;
  initialDescription: string;
};

function EditRankingForm({
  rankingId,
  initialTitle,
  initialDescription,
}: EditRankingFormProps) {
  const [title, setTitle] =
    useState(initialTitle);

  const [description, setDescription] =
    useState(initialDescription);

  const [errors, setErrors] =
    useState<ValidationErrors>({});

  const updateRanking =
    useUpdateRanking(rankingId);

  function clearError(
    field: keyof ValidationErrors
  ) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function validateForm():
    ValidationErrors {
    const nextErrors:
      ValidationErrors = {};

    const cleanTitle =
      title.trim();

    const cleanDescription =
      description.trim();

    if (!cleanTitle) {
      nextErrors.title =
        "Enter a name for your ranking.";
    } else if (
      cleanTitle.length > 100
    ) {
      nextErrors.title =
        "Keep the title under 100 characters.";
    }

    if (
      cleanDescription.length > 500
    ) {
      nextErrors.description =
        "Keep the description under 500 characters.";
    }

    return nextErrors;
  }

  async function handleSave() {
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

    try {
      await updateRanking.mutateAsync({
        title: title.trim(),
        description:
          description.trim() ||
          undefined,
      });

      router.back();
    } catch {
      setErrors({
        submit:
          "Something went wrong while saving your ranking.",
      });
    }
  }

  return (
    <TouchableWithoutFeedback
      onPress={Keyboard.dismiss}
      accessible={false}
    >
      <View style={styles.container}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Title
          </Text>

          <TextInput
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              clearError("title");
            }}
            placeholder="Ranking title"
            autoFocus
            style={[
              styles.input,
              errors.title &&
                styles.inputError,
            ]}
          />

          {errors.title && (
            <Text style={styles.errorText}>
              {errors.title}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Description
          </Text>

          <Text style={styles.fieldDescription}>
            Add context about what this ranking represents.
          </Text>

          <TextInput
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              clearError(
                "description"
              );
            }}
            multiline
            placeholder="What is this ranking about?"
            style={[
              styles.input,
              styles.descriptionInput,
              errors.description &&
                styles.inputError,
            ]}
          />

          {errors.description && (
            <Text style={styles.errorText}>
              {errors.description}
            </Text>
          )}
        </View>

        {errors.submit && (
          <View
            style={styles.submitError}
          >
            <Text
              style={
                styles.submitErrorText
              }
            >
              {errors.submit}
            </Text>
          </View>
        )}

        <Pressable
          style={[
            styles.button,
            updateRanking.isPending &&
              styles.disabledButton,
          ]}
          onPress={handleSave}
          disabled={
            updateRanking.isPending
          }
        >
          <Text style={styles.buttonText}>
            {updateRanking.isPending
              ? "Saving..."
              : "Save Changes"}
          </Text>
        </Pressable>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 28,
  },

  field: {
    gap: 8,
  },

  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
  },

  fieldDescription: {
    fontSize: 14,
    opacity: 0.55,
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

  descriptionInput: {
    minHeight: 110,
    textAlignVertical: "top",
  },

  errorText: {
    color: "#D92D20",
    fontSize: 13,
  },

  submitError: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#FEE4E2",
  },

  submitErrorText: {
    color: "#B42318",
    fontSize: 14,
  },

  button: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "black",
  },

  disabledButton: {
    opacity: 0.5,
  },

  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
});