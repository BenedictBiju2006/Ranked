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
import { RatingControl } from "./RatingControl";

export type RankingItemFormValues = {
  name: string;
  description?: string;
  score: number;
};

type RankingItemFormProps = {
  scoringMode: RankingScoringMode;
  initialName?: string;
  initialDescription?: string;
  initialScore?: number | null;
  submitLabel: string;
  isPending?: boolean;
  onSubmit: (values: RankingItemFormValues) => Promise<void>;
};

type ValidationErrors = {
  name?: string;
  description?: string;
  rating?: string;
  submit?: string;
};

export function RankingItemForm({
  scoringMode,
  initialName = "",
  initialDescription = "",
  initialScore = null,
  submitLabel,
  isPending = false,
  onSubmit,
}: RankingItemFormProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);

  const [selectedScore, setSelectedScore] =
    useState<number | null>(initialScore);

  const [scoreInput, setScoreInput] = useState(
    scoringMode === "score_10" && initialScore !== null
      ? String(initialScore)
      : ""
  );

  const [errors, setErrors] =
    useState<ValidationErrors>({});

  function clearError(
    field: keyof ValidationErrors
  ) {
    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));
  }

  function getScore(): number | null {
    if (scoringMode !== "score_10") {
      return selectedScore;
    }

    if (!scoreInput.trim()) {
      return null;
    }

    const parsedScore = Number(scoreInput);

    return Number.isNaN(parsedScore)
      ? null
      : parsedScore;
  }

  function validateForm() {
    const nextErrors: ValidationErrors = {};
    const cleanName = name.trim();
    const cleanDescription = description.trim();
    const score = getScore();

    if (!cleanName) {
      nextErrors.name =
        "Enter a name for this item.";
    } else if (cleanName.length > 100) {
      nextErrors.name =
        "Keep the name under 100 characters.";
    }

    if (cleanDescription.length > 500) {
      nextErrors.description =
        "Keep the description under 500 characters.";
    }

    if (score === null) {
      nextErrors.rating =
        "Choose a rating.";
    } else if (
      scoringMode === "score_10" &&
      (score < 0 || score > 10)
    ) {
      nextErrors.rating =
        "Enter a score between 0 and 10.";
    }

    return {
      errors: nextErrors,
      score,
    };
  }

  async function handleSubmit() {
    const validation = validateForm();

    if (
      Object.keys(validation.errors).length > 0 ||
      validation.score === null
    ) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    try {
      await onSubmit({
        name: name.trim(),
        description:
          description.trim() || undefined,
        score: validation.score,
      });
    } catch {
      setErrors({
        submit:
          "Something went wrong. Try again.",
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
            Name
          </Text>

          <TextInput
            value={name}
            onChangeText={(value) => {
              setName(value);
              clearError("name");
            }}
            placeholder="e.g. Interstellar"
            autoFocus
            style={[
              styles.input,
              errors.name && styles.inputError,
            ]}
          />

          {errors.name && (
            <Text style={styles.errorText}>
              {errors.name}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Description
          </Text>

          <Text style={styles.fieldDescription}>
            Add any thoughts or context you want to remember.
          </Text>

          <TextInput
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              clearError("description");
            }}
            placeholder="Why does this belong here?"
            multiline
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

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>
            Rating
          </Text>

          <Text style={styles.fieldDescription}>
            {getRatingDescription(
              scoringMode
            )}
          </Text>

          {scoringMode === "score_10" ? (
            <View
              style={[
                styles.scoreInputContainer,
                errors.rating &&
                  styles.inputError,
              ]}
            >
              <TextInput
                value={scoreInput}
                onChangeText={(value) => {
                  setScoreInput(value);
                  clearError("rating");
                }}
                placeholder="8.5"
                keyboardType="decimal-pad"
                style={styles.scoreInput}
              />

              <Text style={styles.scoreSuffix}>
                / 10
              </Text>
            </View>
          ) : (
            <RatingControl
              scoringMode={scoringMode}
              value={selectedScore}
              onChange={(value) => {
                setSelectedScore(value);
                clearError("rating");
              }}
            />
          )}

          {errors.rating && (
            <Text style={styles.errorText}>
              {errors.rating}
            </Text>
          )}
        </View>

        {errors.submit && (
          <View style={styles.submitError}>
            <Text
              style={styles.submitErrorText}
            >
              {errors.submit}
            </Text>
          </View>
        )}

        <Pressable
          style={[
            styles.button,
            isPending &&
              styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={isPending}
        >
          <Text style={styles.buttonText}>
            {isPending
              ? "Saving..."
              : submitLabel}
          </Text>
        </Pressable>
      </View>
    </TouchableWithoutFeedback>
  );
}

function getRatingDescription(
  scoringMode: RankingScoringMode
): string {
  switch (scoringMode) {
    case "binary":
      return "Do you like or dislike this item?";

    case "stars_5":
      return "Choose a rating from 1 to 5 stars.";

    case "score_10":
      return "Enter a score between 0 and 10.";
  }
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
    fontSize: 13,
    color: "#D92D20",
  },

  scoreInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },

  scoreInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: "600",
  },

  scoreSuffix: {
    fontSize: 18,
    opacity: 0.5,
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
