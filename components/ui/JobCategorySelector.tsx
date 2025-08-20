import { MetaOption } from "@/types/entities";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "react-native-paper";


interface Props {
  categories: MetaOption[];
  selectedValue: number | null;
  onSelect: (value: number) => void;
}

export default function CategorySelector({
  categories,
  selectedValue,
  onSelect,
}: Props) {
  const [search, setSearch] = useState("");
  const [filteredCategories, setFilteredCategories] =
    useState<MetaOption[]>(categories);
  const [jobCategories, setJobCategories] = useState<
    { label: string; value: number }[]
  >([]);

  useEffect(() => {
    setFilteredCategories(
      categories
        .filter((cat) => cat.name.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 5)
    );
  }, [search, categories]);

  return (
    <View>
      <TextInput
        placeholder="Search for your field of expertise..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
        style={styles.input}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <View style={styles.dropdown}>
        {filteredCategories.map((cat) => (
          <View
            key={cat.id}
            style={{
              paddingHorizontal: 4,
              marginVertical: 4,
              flexShrink: 1,
            }}
          >
            <Button
              mode={selectedValue === cat.id ? "contained" : "outlined"}
              onPress={() => {
                onSelect(cat.id);
              }}
              style={{ borderRadius: 12, minWidth: 80 }} // optional min width
              contentStyle={{ flexDirection: "row", justifyContent: "center" }}
            >
              <Text
                style={{
                  color: selectedValue === cat.id ? "white" : "#888",
                }}
              >
                {cat.name}
              </Text>
            </Button>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start", // align left
    marginBottom: 16,
    gap: 8, // works on newer React Native versions
  },

  label: {
    color: "#fff",
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 16,
    minHeight: 48,
  },
});
