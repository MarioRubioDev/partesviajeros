// src/ai/flows/suggest-xml-data.ts
'use server';

/**
 * @fileOverview Provides AI-powered suggestions for completing XML data fields based on the schema and existing data patterns.
 *
 * - suggestXmlData - A function that handles the XML data suggestion process.
 * - SuggestXmlDataInput - The input type for the suggestXmlData function.
 * - SuggestXmlDataOutput - The return type for the suggestXmlData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestXmlDataInputSchema = z.object({
  xmlSchema: z
    .string()
    .describe('The XML schema (.xsd) content as a string.'),
  existingData: z
    .string()
    .describe('The existing XML data as a string.  Can be empty.'),
  fieldDescription: z
    .string()
    .describe('Description of the field to be completed.'),
});
export type SuggestXmlDataInput = z.infer<typeof SuggestXmlDataInputSchema>;

const SuggestXmlDataOutputSchema = z.object({
  suggestion: z
    .string()
    .describe('The AI-powered suggestion for completing the XML data field.'),
});
export type SuggestXmlDataOutput = z.infer<typeof SuggestXmlDataOutputSchema>;

export async function suggestXmlData(input: SuggestXmlDataInput): Promise<SuggestXmlDataOutput> {
  return suggestXmlDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestXmlDataPrompt',
  input: {schema: SuggestXmlDataInputSchema},
  output: {schema: SuggestXmlDataOutputSchema},
  prompt: `You are an AI assistant helping users complete XML data based on a given XML schema and existing data.

  Your task is to provide a suggestion for completing a specific field in the XML data, taking into account the schema constraints and any existing data patterns.

  Here is the XML schema:
  \`\`\`xml
  {{{xmlSchema}}}
  \`\`\`

  Here is the existing XML data (if any):
  \`\`\`xml
  {{{existingData}}}
  \`\`\`

  Here is the description of the field to be completed:
  {{{fieldDescription}}}

  Please provide a suggestion for completing this field. The suggestion should be a valid value according to the schema and consistent with the existing data.
  Return just the suggested value, not any explanation or additional text.
  `, // Added explanation
});

const suggestXmlDataFlow = ai.defineFlow(
  {
    name: 'suggestXmlDataFlow',
    inputSchema: SuggestXmlDataInputSchema,
    outputSchema: SuggestXmlDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
