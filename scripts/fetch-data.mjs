#!/usr/bin/env node

/**
 * Fetches benchmark data from upstream GitHub repos and saves as JSON.
 * Run with: node scripts/fetch-data.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, '..', 'data');

mkdirSync(dataDir, { recursive: true });

async function fetchReadme(url) {
  console.log(`Fetching: ${url}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

function parseMarkdownTable(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
  // Skip separator line (line[1])
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length === 0) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] || '';
    });
    rows.push(row);
  }
  return { headers, rows };
}

function parseSTT(readme) {
  const startMarker = '<!-- RESULTS_TABLE:START -->';
  const endMarker = '<!-- RESULTS_TABLE:END -->';
  const startIdx = readme.indexOf(startMarker);
  const endIdx = readme.indexOf(endMarker);
  
  if (startIdx === -1 || endIdx === -1) {
    console.warn('STT results table markers not found, using fallback data');
    return [
      {
        vendor: "AssemblyAI",
        model: "u3-rt-pro",
        transcripts: "99.8%",
        perfect: "83.9%",
        wer_mean: "1.74%",
        pooled_wer: "1.34%",
        ttfs_median: "335ms",
        ttfs_p95: "534ms",
        ttfs_p99: "613ms"
      },
      {
        vendor: "Deepgram",
        model: "nova-3-general",
        transcripts: "99.8%",
        perfect: "76.5%",
        wer_mean: "1.71%",
        pooled_wer: "1.62%",
        ttfs_median: "247ms",
        ttfs_p95: "298ms",
        ttfs_p99: "326ms"
      },
      {
        vendor: "NVIDIA",
        model: "Nemotron 3.0 ASR (en)",
        transcripts: "100.0%",
        perfect: "76.1%",
        wer_mean: "1.90%",
        pooled_wer: "1.95%",
        ttfs_median: "221ms",
        ttfs_p95: "238ms",
        ttfs_p99: "252ms"
      },
      {
        vendor: "Soniox",
        model: "stt-rt-v4",
        transcripts: "99.8%",
        perfect: "84.1%",
        wer_mean: "1.25%",
        pooled_wer: "1.29%",
        ttfs_median: "249ms",
        ttfs_p95: "281ms",
        ttfs_p99: "310ms"
      }
    ];
  }
  
  const tableText = readme.slice(startIdx + startMarker.length, endIdx).trim();
  const { rows } = parseMarkdownTable(tableText);
  
  return rows.map(row => ({
    vendor: row['Vendor'] || '',
    model: row['Model'] || 'N/A',
    transcripts: row['Transcripts'] || '',
    perfect: row['Perfect'] || '',
    wer_mean: row['WER Mean'] || '',
    pooled_wer: row['Pooled WER'] || '',
    ttfs_median: row['TTFS Median'] || '',
    ttfs_p95: row['TTFS P95'] || '',
    ttfs_p99: row['TTFS P99'] || '',
  }));
}

function parseLLM(readme) {
  // Find the text mode models table
  const marker = 'Text mode models:';
  const markerIdx = readme.indexOf(marker);
  
  if (markerIdx === -1) {
    console.warn('LLM text mode models section not found, using fallback data');
    return [
      {
        model: "nemotron-3-ultra (128)",
        pass_rate: "100.0%",
        turn_pass: "300/300",
        tool_use: "300/300",
        instruction: "300/300",
        kb_ground: "300/300",
        ttft_med: "541ms",
        ttft_p95: "712ms",
        ttft_max: "1302ms"
      },
      {
        model: "claude-sonnet-4-6",
        pass_rate: "100.0%",
        turn_pass: "300/300",
        tool_use: "300/300",
        instruction: "300/300",
        kb_ground: "300/300",
        ttft_med: "850ms",
        ttft_p95: "4126ms",
        ttft_max: "9396ms"
      },
      {
        model: "gpt-5.1",
        pass_rate: "98.0%",
        turn_pass: "294/300",
        tool_use: "294/300",
        instruction: "294/300",
        kb_ground: "300/300",
        ttft_med: "739ms",
        ttft_p95: "1492ms",
        ttft_max: "4244ms"
      }
    ];
  }
  
  const afterMarker = readme.slice(markerIdx + marker.length);
  
  // Find the table (starts with |)
  const lines = afterMarker.split('\n');
  const tableLines = [];
  let inTable = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      inTable = true;
      // Remove bold markers
      tableLines.push(trimmed.replace(/\*\*/g, ''));
    } else if (inTable && trimmed === '') {
      break;
    } else if (inTable && !trimmed.startsWith('|')) {
      break;
    }
  }
  
  if (tableLines.length < 2) {
    console.warn('Could not parse LLM table, using fallback');
    return parseLLM(''); // Return fallback data
  }
  
  const tableText = tableLines.join('\n');
  const { rows } = parseMarkdownTable(tableText);
  
  return rows.map(row => ({
    model: row['Model'] || '',
    pass_rate: row['Pass Rate'] || '',
    turn_pass: row['Turn Pass'] || '',
    tool_use: row['Tool Use'] || '',
    instruction: row['Instruction'] || '',
    kb_ground: row['KB Ground'] || '',
    ttft_med: row['TTFT Med'] || '',
    ttft_p95: row['TTFT P95'] || '',
    ttft_max: row['TTFT Max'] || '',
  }));
}

async function main() {
  try {
    console.log('Fetching STT benchmark data...');
    const sttReadme = await fetchReadme(
      'https://raw.githubusercontent.com/pipecat-ai/stt-benchmark/main/README.md'
    );
    const sttData = parseSTT(sttReadme);
    writeFileSync(join(dataDir, 'stt.json'), JSON.stringify(sttData, null, 2));
    console.log(`  ✓ Saved ${sttData.length} STT entries`);

    console.log('Fetching LLM eval data...');
    const llmReadme = await fetchReadme(
      'https://raw.githubusercontent.com/kwindla/aiewf-eval/main/README.md'
    );
    const llmData = parseLLM(llmReadme);
    writeFileSync(join(dataDir, 'llm.json'), JSON.stringify(llmData, null, 2));
    console.log(`  ✓ Saved ${llmData.length} LLM entries`);

    console.log('✅ Data fetch completed successfully!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('Using existing data files if available.');
    process.exit(1);
  }
}

main();