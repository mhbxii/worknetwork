import { useState } from 'react';

export function useAIMatching() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateMatchingScore = async (prompt: string): Promise<number> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      const data = await res.json();
      
      if (!res.ok || !data?.candidates?.length) {
        throw new Error(data?.error?.message || "Gemini request failed");
      }

      const rawText = data.candidates[0]?.content?.parts?.[0]?.text || "";
      
      // Extract numeric score from response (expecting format like "8.5/10" or just "8.5")
      const scoreMatch = rawText.match(/(\d+(?:\.\d+)?)/);
      
      if (!scoreMatch) {
        throw new Error("Could not extract numeric score from AI response: " + rawText);
      }

      const score = parseFloat(scoreMatch[1]);
      
      // Ensure score is between 0-10
      const normalizedScore = Math.min(Math.max(score, 0), 10);
      
      console.log("AI Matching Score calculated:", normalizedScore);
      return normalizedScore;

    } catch (err: any) {
      console.error("AI Matching Error:", err.message);
      setError(err.message);
      // Return null score on error - caller should handle this
      return 0;
    } finally {
      setLoading(false);
    }
  };

  return { calculateMatchingScore, loading, error };
}