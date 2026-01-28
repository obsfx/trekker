import { Command } from "commander";
import {
  findSimilar,
  resolveSearchInput,
  type SimilarResponse,
} from "../services/similar";
import { handleCommandError, outputResult } from "../utils/output";

export { type SimilarResult, type SimilarResponse } from "../services/similar";

export const similarCommand = new Command("similar")
  .description("Find similar tasks/epics by ID or text (duplicate detection)")
  .argument("<id-or-text>", "Task/Epic ID (TREK-n, EPIC-n) or text to search for")
  .option("--threshold <n>", "Minimum similarity threshold 0-1 (default: 0.7)", "0.7")
  .option("--limit <n>", "Maximum results (default: 10)", "10")
  .action(async (idOrText, options) => {
    try {
      const threshold = parseFloat(options.threshold);
      const limit = parseInt(options.limit, 10);

      if (isNaN(threshold) || threshold < 0 || threshold > 1) {
        throw new Error("Invalid threshold value. Must be between 0 and 1.");
      }

      if (isNaN(limit) || limit < 1) {
        throw new Error("Invalid limit value. Must be a positive integer.");
      }

      const { searchText, sourceId, sourceText } = await resolveSearchInput(idOrText);

      const results = await findSimilar(searchText, {
        threshold,
        limit,
        excludeId: sourceId,
      });

      const response: SimilarResponse = {
        sourceId,
        sourceText,
        threshold,
        results,
      };

      outputResult(response, formatSimilarResults);
    } catch (err) {
      handleCommandError(err);
    }
  });

interface ScoreIndicator {
  symbol: string;
  suggestion: string;
}

function getScoreIndicator(percent: number): ScoreIndicator {
  if (percent >= 90) return { symbol: "!!", suggestion: "LIKELY DUPLICATE - review before creating" };
  if (percent >= 80) return { symbol: "!", suggestion: "Highly related - check if same issue" };
  return { symbol: "", suggestion: "" };
}

function formatSimilarResults(response: SimilarResponse): string {
  const lines: string[] = [];

  if (response.sourceId) {
    lines.push(`Similar to: ${response.sourceId}`);
  } else if (response.sourceText) {
    lines.push(`Similar to: "${response.sourceText}"`);
  }
  lines.push(`Threshold: ${response.threshold}`);
  lines.push("");

  if (response.results.length === 0) {
    lines.push("No similar items found.");
    return lines.join("\n");
  }

  lines.push("Potential duplicates/related items:");
  lines.push("");

  for (const r of response.results) {
    const percent = Math.round(r.similarity * 100);
    const statusLabel = r.status ? ` [${r.status}]` : "";
    const { symbol, suggestion } = getScoreIndicator(percent);

    const idPad = r.id.padEnd(10);
    const percentLabel = `[${percent}%]${symbol}`;

    lines.push(`${idPad} ${percentLabel}${statusLabel}`);
    if (r.title) {
      lines.push(`  ${r.title}`);
    }
    if (suggestion) {
      lines.push(`  -> ${suggestion}`);
    }
    lines.push("");
  }

  return lines.join("\n").trimEnd();
}
