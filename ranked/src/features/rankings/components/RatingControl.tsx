import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { RankingScoringMode } from "../domain/ranking.types";

type RatingControlProps = {
  scoringMode: RankingScoringMode;
  value: number | null;
  onChange?: (value: number) => void;
};

export function RatingControl({
  scoringMode,
  value,
  onChange,
}: RatingControlProps) {
  if (scoringMode === "binary") {
    return (
      <BinaryRating
        value={value}
        onChange={onChange}
      />
    );
  }

  if (scoringMode === "stars_5") {
    return (
      <StarRating
        value={value}
        onChange={onChange}
      />
    );
  }

  return null;
}

type RatingProps = {
  value: number | null;
  onChange?: (value: number) => void;
};

function BinaryRating({
  value,
  onChange,
}: RatingProps) {
  if (!onChange) {
    if (value === null) {
      return <Text style={styles.unrated}>Not rated</Text>;
    }

    return (
      <View style={styles.binaryDisplay}>
        <Text style={styles.binaryDisplayText}>
          {value === 1 ? "Like" : "Dislike"}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.binaryContainer}>
      <Pressable
        style={[
          styles.binaryButton,
          value === 1 && styles.selectedButton,
        ]}
        onPress={() => onChange(1)}
      >
        <Text
          style={[
            styles.binaryText,
            value === 1 && styles.selectedText,
          ]}
        >
          Like
        </Text>
      </Pressable>

      <Pressable
        style={[
          styles.binaryButton,
          value === 0 && styles.selectedButton,
        ]}
        onPress={() => onChange(0)}
      >
        <Text
          style={[
            styles.binaryText,
            value === 0 && styles.selectedText,
          ]}
        >
          Dislike
        </Text>
      </Pressable>
    </View>
  );
}

function StarRating({
  value,
  onChange,
}: RatingProps) {
  if (value === null && !onChange) {
    return <Text style={styles.unrated}>Not rated</Text>;
  }

  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((star) => {
        const selected =
          value !== null &&
          star <= value;

        if (!onChange) {
          return (
            <Text
              key={star}
              style={[
                styles.star,
                selected && styles.selectedStar,
              ]}
            >
              ★
            </Text>
          );
        }

        return (
          <Pressable
            key={star}
            onPress={() => onChange(star)}
          >
            <Text
              style={[
                styles.star,
                selected && styles.selectedStar,
              ]}
            >
              ★
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  binaryContainer: {
    flexDirection: "row",
    gap: 12,
  },

  binaryButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: "center",
  },

  selectedButton: {
    backgroundColor: "black",
  },

  binaryText: {
    fontSize: 16,
    fontWeight: "600",
  },

  selectedText: {
    color: "white",
  },

  binaryDisplay: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 8,
  },

  binaryDisplayText: {
    fontSize: 14,
    fontWeight: "600",
  },

  starContainer: {
    flexDirection: "row",
    gap: 6,
  },

  star: {
    fontSize: 30,
    opacity: 0.2,
  },

  selectedStar: {
    opacity: 1,
  },

  unrated: {
    fontSize: 14,
    opacity: 0.5,
  },
});