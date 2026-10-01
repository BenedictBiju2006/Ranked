import { router } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";

import { useAddRankingItem } from "../hooks/useAddRankingItem";
import { useRanking } from "../hooks/useRankings";
import { RatingControl } from "../components/RatingControl";

type AddRankingItemScreenProps = {
  rankingId: string;
};

type ValidationErrors = {
  name?: string;
  description?: string;
  rating?: string;
  submit?: string;
};

export function AddRankingItemScreen({
  rankingId,
}: AddRankingItemScreenProps) {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});

  const { data: ranking, isPending, isError } = useRanking(rankingId);
  const addRankingItem = useAddRankingItem(rankingId);

  if (isPending) {
    return (
      <View style={styles.container}>
        <Text>Loading ranking...</Text>
      </View>
    );
  }

  if (isError || !ranking) {
    return (
      <View style={styles.container}>
        <Text>Ranking not found.</Text>
      </View>
    );
  }

  function getScore(): number | null {
    if (ranking?.scoringMode === "score_10") {
      if (!scoreInput.trim()) {
        return null;
      }

      const parsedScore = Number(scoreInput);

      return Number.isNaN(parsedScore) ? null : parsedScore;
    }

    return selectedScore;
  }

  function validateForm(): {
    score: number | null;
    errors: ValidationErrors;
  } {
    const nextErrors: ValidationErrors = {};
    const cleanItemName = itemName.trim();
    const cleanDescription = description.trim();
    const score = getScore();

    if (!cleanItemName) {
      nextErrors.name = "Enter a name for this item.";
    } else if (cleanItemName.length > 100) {
      nextErrors.name = "Keep the name under 100 characters.";
    }

    if (cleanDescription.length > 500) {
      nextErrors.description = "Keep the description under 500 characters.";
    }

    if (score === null) {
      nextErrors.rating = "Choose a rating.";
    } else if (ranking?.scoringMode === "score_10" && (score < 0 || score > 10)) {
      nextErrors.rating = "Enter a score between 0 and 10.";
    } else if (ranking?.scoringMode === "stars_5" && (score < 0 || score > 5)) {
      nextErrors.rating = "Choose a rating between 0 and 5 stars.";
    }

    return {
      score,
      errors: nextErrors,
    };
  }

  async function handleAdd() {
    const validation = validateForm();

    if (Object.keys(validation.errors).length > 0 || validation.score === null) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    try {
      await addRankingItem.mutateAsync({
        name: itemName.trim(),
        description: description.trim() || undefined,
        score: validation.score,
      });

      router.back();
    } catch {
      setErrors({
        submit: "Something went wrong while adding this item. Try again.",
      });
    }
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
        <Text style={styles.title}>Add Item</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Name</Text>

          <TextInput
            value={itemName}
            onChangeText={(value) => {
              setItemName(value);
              setErrors((current) => ({
                ...current,
                name: undefined,
              }));
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
          <Text style={styles.fieldLabel}>Description</Text>
          <Text style={styles.fieldDescription}>
            Add any thoughts or context you want to remember.
          </Text>

          <TextInput
            value={description}
            onChangeText={(value) => {
              setDescription(value);
              setErrors((current) => ({
                ...current,
                description: undefined,
              }));
            }}
            placeholder="Why does this belong here?"
            multiline
            style={[
              styles.input,
              styles.descriptionInput,
              errors.description && styles.inputError,
            ]}
          />

          {errors.description && (
            <Text style={styles.errorText}>
              {errors.description}
            </Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Rating</Text>

          <Text style={styles.fieldDescription}>
            {ranking.scoringMode === "binary" &&
              "Do you like or dislike this item?"}

            {ranking.scoringMode === "stars_5" &&
              "Choose a rating from 1 to 5 stars."}

            {ranking.scoringMode === "score_10" &&
              "Enter a score between 0 and 10."}
          </Text>

          {ranking.scoringMode === "score_10" ? (
            <View
              style={[
                styles.scoreInputContainer,
                errors.rating && styles.inputError,
              ]}
            >
              <TextInput
                value={scoreInput}
                onChangeText={(value) => {
                  setScoreInput(value);
                  setErrors((current) => ({
                    ...current,
                    rating: undefined
                  }));
                }}
                placeholder="8.5"
                keyboardType="decimal-pad"
                style={styles.scoreInput}
              />

              <Text style={styles.scoreSuffix}>/ 10</Text>
            </View>
          ) : (
            <RatingControl
              scoringMode={ranking.scoringMode}
              value={selectedScore}
              onChange={(value) => {
                setSelectedScore(value);
                setErrors((current) => ({
                    ...current,
                    rating: undefined
                  }));
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
            <Text style={styles.submitErrorText}>
              {errors.submit}
            </Text>
          </View>
        )}

        <Pressable
          style={[
            styles.button,
            addRankingItem.isPending && styles.disabledButton,
          ]}
          onPress={handleAdd}
          disabled={addRankingItem.isPending}
        >
          <Text style={styles.buttonText}>
            {addRankingItem.isPending ? "Adding..." : "Add Item"}
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