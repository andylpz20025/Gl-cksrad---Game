
import { GoogleGenAI, Type } from "@google/genai";
import { Puzzle } from "../types";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || 'fallback_key' });
  }

  private async wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generatePuzzle(difficulty: 'easy' | 'medium' | 'hard', usedCategories: string[]): Promise<Puzzle> {
    let attempts = 0;
    const maxAttempts = 2; // Reduced attempts to fail faster to fallback if quota is issue

    while (attempts < maxAttempts) {
      try {
        if (!process.env.API_KEY) throw new Error("No API Key configured");

        const model = this.ai.models;
        
        // German words can be very long. We instruct the model to use hyphens for compound words
        // so they can break across lines on the 13-column grid.
        const prompt = `
          Generate a German word puzzle for a "Wheel of Fortune" style game.
          Difficulty: ${difficulty}.
          
          Requirements:
          1. Language: German.
          2. Total Grid Size: 4 lines, 13 columns wide.
          3. IMPORTANT: No single word can be longer than 13 letters. 
          4. IF A WORD IS LONGER THAN 13 LETTERS (Compound words), YOU MUST INSERT A HYPHEN ("-") TO SPLIT IT.
             Example: "DONAUDAMPFSCHIFFFAHRT" -> "DONAUDAMPF- SCHIFFFAHRT" (Split logical parts).
          5. Category should be short (e.g., "Sprichwort", "Person", "Geografie", "Technik").
          6. Do not use these categories: ${usedCategories.join(', ')}.
          7. Do NOT use the word "RELATIVITÄTSTHEORIE".
          
          Output strictly in JSON format.
        `;

        const response = await model.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING },
                text: { type: Type.STRING, description: "The puzzle text in uppercase. Use hyphens for long words." }
              },
              required: ["category", "text"]
            }
          }
        });

        if (response.text) {
          const data = JSON.parse(response.text);
          return {
            category: data.category.toUpperCase(),
            text: data.text.toUpperCase().replace(/[^A-ZÄÖÜß \-]/g, '') // Allow hyphen
          };
        }
        
        throw new Error("No response text received");

      } catch (error: any) {
        const isRateLimit = error.status === 429 || error.code === 429 || (error.message && error.message.includes('429'));
        
        if (isRateLimit) {
           console.warn("Gemini API Quota Exceeded (429). Using Fallback Library.");
           break; // Immediately go to fallback
        }
        
        attempts++;
        if (attempts < maxAttempts) {
            await this.wait(1000);
        }
      }
    }

    return this.getFallbackPuzzle(difficulty);
  }

  private getFallbackPuzzle(difficulty: string): Puzzle {
    // Pre-defined list of safe puzzles that definitely fit the 13-col grid
    // Long words have hyphens inserted manually where appropriate.
    const fallbacks: Puzzle[] = [
      { category: 'SPRICHWORT', text: 'MORGENSTUND HAT GOLD IM MUND' },
      { category: 'FILMTITEL', text: 'DER HERR DER RINGE' },
      { category: 'GEOGRAFIE', text: 'BAYERISCHER WALD' },
      { category: 'ESSEN', text: 'CURRYWURST MIT POMMES' },
      { category: 'BERUF', text: 'SCHORNSTEIN- FEGER' }, // Split for safety
      { category: 'TECHNIK', text: 'KÜNSTLICHE INTELLIGENZ' },
      { category: 'TIERE', text: 'ELEFANT IM PORZELLAN- LADEN' },
      { category: 'SPRICHWORT', text: 'WER RASTET DER ROSTET' },
      { category: 'ORT', text: 'BRANDENBURGER TOR' },
      { category: 'ESSEN', text: 'WIENER SCHNITZEL' },
      { category: 'FILM', text: 'KRIEG DER STERNE' },
      { category: 'HOBBY', text: 'BRIEFMARKEN SAMMELN' },
      { category: 'WETTER', text: 'GEWITTER IM ANZUG' },
      { category: 'SPORT', text: 'FUSSBALL WELT- MEISTERSCHAFT' },
      { category: 'HAUSHALT', text: 'WASCH- MASCHINE' },
      { category: 'VERKEHR', text: 'AUTOBAHN- AUSFAHRT' },
      { category: 'KLEIDUNG', text: 'KURZE LEDERHOSE' },
      { category: 'SPRICHWORT', text: 'ALLER ANFANG IST SCHWER' },
      { category: 'LITERATUR', text: 'FAUST EINE TRAGÖDIE' },
      { category: 'STADT', text: 'HAMBURG MEINE PERLE' },
      { category: 'HISTORIE', text: 'DER FALL DER MAUER' },
      { category: 'PFLANZE', text: 'ROTE ROSE' },
      { category: 'BERUF', text: 'KRAFTFAHRZEUG- MECHANIKER' },
      { category: 'MUSIK', text: 'DIE VIER JAHRES- ZEITEN' },
      { category: 'CHEMIE', text: 'SAUERSTOFF- FLASCHE' },
      { category: 'OBST', text: 'GRÜNER APFEL' },
      { category: 'MÖBEL', text: 'KLEIDER- SCHRANK' },
      { category: 'STADT', text: 'MÜNCHEN LEUCHTET' },
      { category: 'WETTER', text: 'SONNEN- SCHEIN' },
      { category: 'SPORT', text: 'OLYMPISCHE SPIELE' },
      { category: 'TIER', text: 'SIBIRISCHER TIGER' },
      { category: 'BERUF', text: 'FEUERWEHR- MANN' },
      { category: 'SPIEL', text: 'MENSCH ÄRGERE DICH NICHT' },
      { category: 'ESSEN', text: 'SCHWARZWÄLDER KIRSCHTORTE' },
      { category: 'NATUR', text: 'STALAKTITEN UND STALAGMITEN' }, // Might need tight fit
      { category: 'ORT', text: 'SCHLOSS NEUSCHWAN- STEIN' },
      { category: 'TECHNIK', text: 'ELEKTRO- AUTO' },
      { category: 'FILM', text: 'KEIN OHR HASEN' },
      { category: 'MUSIK', text: 'ATEMLOS DURCH DIE NACHT' },
      { category: 'GEGENSTAND', text: 'TASCHEN- LAMPE' }
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export const geminiService = new GeminiService();
