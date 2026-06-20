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

// Sample data for now - in real version this would fetch from GitHub
const sttData = [
  {
    "vendor": "AssemblyAI",
    "model": "u3-rt-pro",
    "transcripts": "99.8%",
    "perfect": "83.9%",
    "wer_mean": "1.74%",
    "pooled_wer": "1.34%",
    "ttfs_median": "335ms",
    "ttfs_p95": "534ms",
    "ttfs_p99": "613ms"
  },
  {
    "vendor": "Deepgram",
    "model": "nova-3-general",
    "transcripts": "99.8%",
    "perfect": "76.5%",
    "wer_mean": "1.71%",
    "pooled_wer": "1.62%",
    "ttfs_median": "247ms",
    "ttfs_p95": "298ms",
    "ttfs_p99": "326ms"
  },
  {
    "vendor": "NVIDIA",
    "model": "Nemotron 3.0 ASR (en)",
    "transcripts": "100.0%",
    "perfect": "76.1%",
    "wer_mean": "1.90%",
    "pooled_wer": "1.95%",
    "ttfs_median": "221ms",
    "ttfs_p95": "238ms",
    "ttfs_p99": "252ms"
  }
];

const llmData = [
  {
    "model": "nemotron-3-ultra (128)",
    "pass_rate": "100.0%",
    "turn_pass": "300/300",
    "tool_use": "300/300",
    "instruction": "300/300",
    "kb_ground": "300/300",
    "ttft_med": "541ms",
    "ttft_p95": "712ms",
    "ttft_max": "1302ms"
  },
  {
    "model": "claude-sonnet-4-6",
    "pass_rate": "100.0%",
    "turn_pass": "300/300",
    "tool_use": "300/300",
    "instruction": "300/300",
    "kb_ground": "300/300",
    "ttft_med": "850ms",
    "ttft_p95": "4126ms",
    "ttft_max": "9396ms"
  },
  {
    "model": "gpt-5.1",
    "pass_rate": "98.0%",
    "turn_pass": "294/300",
    "tool_use": "294/300",
    "instruction": "294/300",
    "kb_ground": "300/300",
    "ttft_med": "739ms",
    "ttft_p95": "1492ms",
    "ttft_max": "4244ms"
  }
];

console.log('Creating sample data files...');
writeFileSync(join(dataDir, 'stt.json'), JSON.stringify(sttData, null, 2));
console.log(`  ✓ Saved ${sttData.length} STT entries`);

writeFileSync(join(dataDir, 'llm.json'), JSON.stringify(llmData, null, 2));
console.log(`  ✓ Saved ${llmData.length} LLM entries`);

console.log('Done! (Using sample data for demo)');