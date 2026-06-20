import { useState, useMemo } from 'react';
import Head from 'next/head';
import sttData from '../data/stt.json';
import llmData from '../data/llm.json';

function SortArrow({ direction }) {
  if (!direction) return <span className="text-gray-300 ml-1">↕</span>;
  return <span className="ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
}

function parseNumeric(val) {
  if (val === null || val === undefined || val === 'N/A') return null;
  const s = String(val).replace(/[ms%]/g, '').replace(/,/g, '').trim();
  const parts = s.split('/');
  if (parts.length === 2) return parseFloat(parts[0]) / parseFloat(parts[1]);
  return parseFloat(s);
}

function DataTable({ columns, data, defaultSort, lowerIsBetter = [] }) {
  const [sortCol, setSortCol] = useState(defaultSort || columns[0].key);
  const [sortDir, setSortDir] = useState('asc');

  const sorted = useMemo(() => {
    const isLower = lowerIsBetter.includes(sortCol);
    return [...data].sort((a, b) => {
      const av = parseNumeric(a[sortCol]);
      const bv = parseNumeric(b[sortCol]);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      const cmp = av - bv;
      if (sortDir === 'asc') return isLower ? cmp : -cmp;
      return isLower ? -cmp : cmp;
    });
  }, [data, sortCol, sortDir, columns, lowerIsBetter]);

  function handleSort(key) {
    if (sortCol === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(key);
      setSortDir('asc');
    }
  }

  const bestValues = useMemo(() => {
    const bests = {};
    columns.forEach(col => {
      if (col.key === 'vendor' || col.key === 'model') return;
      const values = data.map(r => parseNumeric(r[col.key])).filter(v => v !== null);
      if (values.length === 0) return;
      const isLower = lowerIsBetter.includes(col.key);
      bests[col.key] = isLower ? Math.min(...values) : Math.max(...values);
    });
    return bests;
  }, [data, columns, lowerIsBetter]);

  function getCellClass(key, value) {
    const numVal = parseNumeric(value);
    if (numVal === null) return '';
    if (bestValues[key] !== undefined && numVal === bestValues[key]) {
      return 'bg-green-50 text-green-800 font-semibold';
    }
    return '';
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-200">
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="px-3 py-3 text-left cursor-pointer hover:bg-gray-50 select-none whitespace-nowrap"
              >
                {col.label}
                <SortArrow direction={sortCol === col.key ? sortDir : null} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
              {columns.map(col => (
                <td
                  key={col.key}
                  className={`px-3 py-2.5 whitespace-nowrap ${getCellClass(col.key, row[col.key])}`}
                >
                  {row[col.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const sttColumns = [
  { key: 'vendor', label: 'Vendor' },
  { key: 'model', label: 'Model' },
  { key: 'transcripts', label: 'Transcripts' },
  { key: 'perfect', label: 'Perfect' },
  { key: 'wer_mean', label: 'WER Mean' },
  { key: 'pooled_wer', label: 'Pooled WER' },
  { key: 'ttfs_median', label: 'TTFS Median' },
  { key: 'ttfs_p95', label: 'TTFS P95' },
  { key: 'ttfs_p99', label: 'TTFS P99' },
];

const llmColumns = [
  { key: 'model', label: 'Model' },
  { key: 'pass_rate', label: 'Pass Rate' },
  { key: 'turn_pass', label: 'Turn Pass' },
  { key: 'tool_use', label: 'Tool Use' },
  { key: 'instruction', label: 'Instruction' },
  { key: 'kb_ground', label: 'KB Ground' },
  { key: 'ttft_med', label: 'TTFT Med' },
  { key: 'ttft_p95', label: 'TTFT P95' },
  { key: 'ttft_max', label: 'TTFT Max' },
];

const sttLowerIsBetter = ['wer_mean', 'pooled_wer', 'ttfs_median', 'ttfs_p95', 'ttfs_p99'];
const llmLowerIsBetter = ['ttft_med', 'ttft_p95', 'ttft_max'];

export default function Home() {
  const [tab, setTab] = useState('stt');

  return (
    <>
      <Head>
        <title>Voice AI Benchmarks</title>
        <meta name="description" content="Compare STT and LLM providers for voice agents" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col bg-white">
        {/* Header */}
        <header className="border-b border-gray-200 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Voice AI Benchmarks</h1>
            <p className="mt-2 text-gray-600">Compare STT and LLM providers for voice agents</p>
          </div>
        </header>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="max-w-7xl mx-auto flex gap-0">
            <button
              onClick={() => setTab('stt')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'stt'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              STT Benchmarks
            </button>
            <button
              onClick={() => setTab('llm')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === 'llm'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              LLM for Voice Agents
            </button>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 px-6 py-6">
          <div className="max-w-7xl mx-auto">
            {tab === 'stt' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Speech-to-Text benchmarks. Lower WER and TTFS is better. Best values highlighted in green.
                </p>
                <DataTable
                  columns={sttColumns}
                  data={sttData}
                  defaultSort="pooled_wer"
                  lowerIsBetter={sttLowerIsBetter}
                />
              </div>
            )}
            {tab === 'llm' && (
              <div>
                <p className="text-sm text-gray-500 mb-4">
                  Multi-turn LLM evaluation for voice agents. Higher pass rate is better. Lower TTFT is better.
                </p>
                <DataTable
                  columns={llmColumns}
                  data={llmData}
                  defaultSort="pass_rate"
                  lowerIsBetter={llmLowerIsBetter}
                />
              </div>
            )}
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 px-6 py-6 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              Data sourced from{' '}
              <a href="https://github.com/pipecat-ai/stt-benchmark" className="underline hover:text-gray-700" target="_blank" rel="noopener">pipecat-ai/stt-benchmark</a>
              {' '}and{' '}
              <a href="https://github.com/kwindla/aiewf-eval" className="underline hover:text-gray-700" target="_blank" rel="noopener">kwindla/aiewf-eval</a>
              . Updated daily.
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span className="font-semibold">🦞 pipecat</span>
              <span className="font-semibold">AWS</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}