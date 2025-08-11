
"use server";

import { suggestXmlData, SuggestXmlDataInput, SuggestXmlDataOutput } from "@/ai/flows/suggest-xml-data";

export async function getSuggestionAction(input: SuggestXmlDataInput): Promise<SuggestXmlDataOutput> {
  try {
    const result = await suggestXmlData(input);
    return result;
  } catch (error) {
    console.error("Error in getSuggestionAction:", error);
    // In a real app, you might want to return a structured error response
    return { suggestion: "" };
  }
}
