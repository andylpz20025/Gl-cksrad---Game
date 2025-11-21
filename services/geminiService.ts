
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

  async generatePuzzle(difficulty: 'easy' | 'medium' | 'hard', usedCategories: string[], theme: string = 'ALL'): Promise<Puzzle> {
    let attempts = 0;
    const maxAttempts = 2; 

    while (attempts < maxAttempts) {
      try {
        if (!process.env.API_KEY) throw new Error("No API Key configured");

        const model = this.ai.models;
        
        let themePrompt = "";
        if (theme === '80s') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to the 1980s (Music, Movies, Events). Do NOT include modern topics.";
        if (theme === 'KIDS') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be suitable for children (Fairy tales, Animals, Simple things). No complex words.";
        if (theme === 'GEO') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to Geography (Cities, Countries, Landmarks).";
        if (theme === 'MOVIES') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be a Movie Title or Actor.";
        if (theme === 'TV') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to Television (Shows, Hosts, Series).";
        if (theme === 'RETRO') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to Retro topics (Nostalgia, Old tech, Old trends).";
        if (theme === 'MUSIC') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to Music (Songs, Bands, Singers).";
        if (theme === 'RETRO_TV') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to classic TV shows from the past (Cult classics). Do NOT include general terms like 'Obst'.";
        if (theme === '50S') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to the 1950s.";
        if (theme === '60S') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to the 1960s.";
        if (theme === '70S') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to the 1970s.";
        if (theme === '90S') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to the 1990s.";
        if (theme === '2000S') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to the 2000s.";
        if (theme === 'GDR') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to the DDR (East Germany), its culture, products, or history.";
        if (theme === 'POLITICS') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be related to Politics or History.";
        if (theme === 'JOB') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be a Profession or Job title.";
        if (theme === 'IDIOM') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be a common German Idiom or Proverb (Redewendung).";
        if (theme === 'PERSON') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be a Famous Person.";
        if (theme === 'HEADLINES') themePrompt = "STRICT CONSTRAINT: The puzzle MUST be a famous Headline or Historical Event.";
        
        // Add randomness to prompt to prevent caching
        const randomSeed = Math.floor(Math.random() * 10000);

        const prompt = `
          Generate a UNIQUE and RANDOM German word puzzle for a "Wheel of Fortune" style game.
          Difficulty: ${difficulty}.
          Seed: ${randomSeed}.
          ${themePrompt ? themePrompt : "Theme: General knowledge, but varied (Science, Nature, Literature, Tech, etc)."}
          
          Requirements:
          1. Language: German.
          2. Total Grid Size: 4 lines, 13 columns wide.
          3. IMPORTANT: No single word can be longer than 13 letters. 
          4. IF A WORD IS LONGER THAN 13 LETTERS (Compound words), YOU MUST INSERT A HYPHEN ("-") TO SPLIT IT.
             Example: "DONAUDAMPFSCHIFFFAHRT" -> "DONAUDAMPF- SCHIFFFAHRT" (Split logical parts).
          5. Category should be short (e.g., "Sprichwort", "Person", "Geografie", "Technik", "Flora & Fauna") and match the theme.
          6. Do not use these previously used categories: ${usedCategories.join(', ')}.
          7. Do NOT use the word "RELATIVITÄTSTHEORIE".
          8. Avoid common clichés. Be creative.
          9. CRITICAL: IF A SPECIFIC THEME CONSTRAINT IS PROVIDED ABOVE, YOU MUST FOLLOW IT STRICTLY. IF "RETRO TV" IS SELECTED, DO NOT GENERATE "FRUIT" PUZZLES.
          
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
            text: data.text.toUpperCase().replace(/[^A-ZÄÖÜß \-]/g, '') 
          };
        }
        
        throw new Error("No response text received");

      } catch (error: any) {
        const isRateLimit = error.status === 429 || error.code === 429 || (error.message && error.message.includes('429'));
        
        if (isRateLimit) {
           console.warn("Gemini API Quota Exceeded (429). Using Fallback Library.");
           break; 
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
    // Extended list to ensure variety even when offline
    const fallbacks: Puzzle[] = [
      { category: 'SPRICHWORT', text: 'MORGENSTUND HAT GOLD IM MUND' },
      { category: 'FILMTITEL', text: 'DER HERR DER RINGE' },
      { category: 'GEOGRAFIE', text: 'BAYERISCHER WALD' },
      { category: 'ESSEN', text: 'CURRYWURST MIT POMMES' },
      { category: 'BERUF', text: 'SCHORNSTEIN- FEGER' }, 
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
      { category: 'NATUR', text: 'STALAKTITEN UND STALAGMITEN' }, 
      { category: 'ORT', text: 'SCHLOSS NEUSCHWAN- STEIN' },
      { category: 'TECHNIK', text: 'ELEKTRO- AUTO' },
      { category: 'FILM', text: 'KEIN OHR HASEN' },
      { category: 'MUSIK', text: 'ATEMLOS DURCH DIE NACHT' },
      { category: 'GEGENSTAND', text: 'TASCHEN- LAMPE' },
      { category: 'ZITAT', text: 'SEIN ODER NICHT SEIN' },
      { category: 'WISSENSCHAFT', text: 'URKNALL- THEORIE' },
      { category: 'TV-SERIE', text: 'TATORT MÜNSTER' },
      { category: 'COMIC', text: 'ASTERIX UND OBELIX' },
      { category: 'GEBÄUDE', text: 'KÖLNER DOM' },
      { category: 'FAHRZEUG', text: 'DAMPF- LOKOMOTIVE' },
      { category: 'LEBENSMITTEL', text: 'VOLLKORN- BROT' },
      { category: 'TRINKEN', text: 'TASSE KAFFEE' },
      { category: 'TIERWELT', text: 'BLAUWAL IM OZEAN' },
      { category: 'REDEWENDUNG', text: 'DEN NAGEL AUF DEN KOPF TREFFEN' },
      { category: 'FLORA', text: 'SONNEN- BLUME' },
      { category: 'ASTRONOMIE', text: 'DAS SCHWARZE LOCH' },
      { category: 'SPIELZEUG', text: 'MODELLEISEN- BAHN' },
      { category: 'BERUF', text: 'POLIZEI- BEAMTER' },
      { category: 'MUSIK', text: 'UDO LINDENBERG' },
      { category: 'SPORT', text: 'TORWAND- SCHIESSEN' },
      { category: 'MEDIZIN', text: 'STETHOSKOP' },
      { category: 'GESCHICHTE', text: 'DIE GOLDENEN ZWANZIGER' }
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }
}

export const geminiService = new GeminiService();
