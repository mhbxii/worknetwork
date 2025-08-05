import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, TouchableOpacity, View } from "react-native";
import CountryFlag from "react-native-country-flag";
import { Text, TextInput } from "react-native-paper";

export default function SelectCountry() {
  const router = useRouter();
  const [countries, setCountries] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("country").select("*").order("name").then(({ data }) => {
      if (data) setCountries(data);
    });
  }, []);

  const filtered = countries.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#1a1a2e", padding: 16 }}>
      <TextInput
        placeholder="Search country..."
        value={search}
        onChangeText={setSearch}
        style={{ marginBottom: 12, backgroundColor: "rgba(255,255,255,0.1)" }}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.countryItem}
            onPress={() => router.back({ country_id: item.id })}
          >
            <CountryFlag isoCode={item.code} size={18} />
            <Text style={styles.countryName}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  countryName: { color: "#fff", marginLeft: 10 },
});
