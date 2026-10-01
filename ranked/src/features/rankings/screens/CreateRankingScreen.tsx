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

import { RankingScoringMode } from "../domain/ranking.types";
import { useCreateRanking } from "../hooks/useCreateRanking";

type ValidationErrors = {
  title?: string;
  description?: string;
  scoringMode?: string;
  submit?: string;
};

export function CreateRankingScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scoringMode, setScoringMode] = useState<RankingScoringMode | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const createRanking = useCreateRanking();

  function clearError(field: keyof ValidationErrors) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function validateForm(): ValidationErrors {
    const nextErrors: ValidationErrors = {};
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (!cleanTitle) {
      nextErrors.title = "Enter a name for your ranking.";
    } else if (cleanTitle.length > 100) {
      nextErrors.title = "Keep the title under 100 characters.";
    }

    if (cleanDescription.length > 500) {
      nextErrors.description = "Keep the description under 500 characters.";
    }

    if (!scoringMode) {
      nextErrors.scoringMode = "Choose a scoring system.";
    }

    return nextErrors;
  }

  async function handleCreate() {
    const validationErrors = validateForm();

    if (Object.keys(validationErrors).length > 0 || !scoringMode) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      const ranking = await createRanking.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        scoringMode,
      });

      router.replace({
        pathname: "/ranking/[id]",
        params: { id: ranking.id },
      });
    } catch {
      setErrors({
        submit: "Something went wrong while creating the ranking. Try again.",
      });
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Text style={styles.title}>Create Ranking</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Title</Text>
          <Text style={styles.fieldDescription}>What are you ranking?</Text>

          <TextInput
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              clearError("title");
            }}
            placeholder="Movies, games, food..."
            autoFocus
            style={[styles.input, errors.title && styles.inputError]}
          />

          {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Description</Text>
          <Text style={styles.fieldDescription}>
            Add context about what this ranking represents.
          </Text>

          <TextInput
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              clearError("description");
            }}
            placeholder="e.g. Movies ranked by how much I enjoyed them"
            multiline
            style={[styles.input, styles.descriptionInput, errors.description && styles.inputError]}
          />

          {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Scoring</Text>
          <Text style={styles.fieldDescription}>How should items in this ranking be rated?</Text>

          <View style={styles.scoringModes}>
            <ScoringModeButton
              label="Like / Dislike"
              description="Simple preference"
              selected={scoringMode === "binary"}
              onPress={() => {
                setScoringMode("binary");
                clearError("scoringMode");
              }}
            />

            <ScoringModeButton
              label="5 Stars"
              description="Classic rating"
              selected={scoringMode === "stars_5"}
              onPress={() => {
                setScoringMode("stars_5");
                clearError("scoringMode");
              }}
            />

            <ScoringModeButton
              label="0–10"
              description="More precise"
              selected={scoringMode === "score_10"}
              onPress={() => {
                setScoringMode("score_10");
                clearError("scoringMode");
              }}
            />
          </View>

          {errors.scoringMode && <Text style={styles.errorText}>{errors.scoringMode}</Text>}
        </View>

        {errors.submit && (
          <View style={styles.submitError}>
            <Text style={styles.submitErrorText}>{errors.submit}</Text>
          </View>
        )}

        <Pressable
          style={[styles.button, createRanking.isPending && styles.disabledButton]}
          onPress={handleCreate}
          disabled={createRanking.isPending}
        >
          <Text style={styles.buttonText}>
            {createRanking.isPending ? "Creating..." : "Create Ranking"}
          </Text>
        </Pressable>
      </View>
    </TouchableWithoutFeedback>
  );
}

type ScoringModeButtonProps = {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
};

function ScoringModeButton({
  label,
  description,
  selected,
  onPress,
}: ScoringModeButtonProps) {
  return (
    <Pressable
      style={[styles.scoringModeButton, selected && styles.selectedScoringModeButton]}
      onPress={onPress}
    >
      <Text style={[styles.scoringModeLabel, selected && styles.selectedScoringModeText]}>
        {label}
      </Text>

      <Text style={[styles.scoringModeDescription, selected && styles.selectedScoringModeDescription]}>
        {description}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    gap: 28,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
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
    minHeight: 100,
    textAlignVertical: "top",
  },

  scoringModes: {
    gap: 10,
  },

  scoringModeButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },

  selectedScoringModeButton: {
    backgroundColor: "black",
  },

  scoringModeLabel: {
    fontSize: 16,
    fontWeight: "600",
  },

  selectedScoringModeText: {
    color: "white",
  },

  scoringModeDescription: {
    marginTop: 3,
    fontSize: 13,
    opacity: 0.5,
  },

  selectedScoringModeDescription: {
    color: "white",
    opacity: 0.7,
  },

  errorText: {
    fontSize: 13,
    color: "#D92D20",
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