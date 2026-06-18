import "dotenv/config";

import { supabase } from "./supabase.js";
import { createEmbedding } from "./ollama.js";

const document = `
Працівник може взяти відпустку тривалістю до 24 календарних днів.

Заяву потрібно подати за 14 днів до початку відпустки.

Лікарняний оплачується відповідно до чинного законодавства.
`;

function splitText(text: string, chunkSize = 300) {
  const chunks: string[] = [];

  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }

  return chunks;
}

// ingest.ts
async function main() {
  const chunks = splitText(document);

  for (const chunk of chunks) {
    // Пропускаємо пусті чанки
    if (!chunk.trim()) continue; 

    const embedding = await createEmbedding(chunk);
    
    if (!embedding) {
      console.log("Пропущено чанк, бо ембеддінг не створився");
      continue;
    }

    await supabase.from("document_chunks").insert({
      content: chunk,
      metadata: { source: "company_rules.txt" },
      embedding
    });

    console.log("Додано чанк");
  }
} 
main();