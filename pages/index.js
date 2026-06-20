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

function PerformanceBadge({ value, isBest, isGood }) {
  if (isBest) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        🏆 {value}
      </span>
    );
  }
  if (isGood) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {value}
      </span>
    );
  }
  return value;
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

  const { bestValues, topTier } = useMemo(() => {
    const bests = {};
    const tops = {};
    
    columns.forEach(col => {
      if (col.key === 'vendor' || col.key === 'model') return;
      const values = data.map(r => parseNumeric(r[col.key])).filter(v => v !== null);
      if (values.length === 0) return;
      
      const isLower = lowerIsBetter.includes(col.key);
      const sortedVals = [...values].sort((a, b) => a - b);
      
      bests[col.key] = isLower ? sortedVals[0] : sortedVals[sortedVals.length - 1];
      
      // Top 20% are "good"
      const topIndex = Math.ceil(sortedVals.length * 0.2);
      tops[col.key] = isLower 
        ? sortedVals[topIndex - 1] 
        : sortedVals[sortedVals.length - topIndex];
    });
    return { bestValues: bests, topTier: tops };
  }, [data, columns, lowerIsBetter]);

  function getCellContent(col, row) {
    const value = row[col.key];
    if (value === null || value === undefined) return '—';
    
    if (col.key === 'vendor' || col.key === 'model') return value;
    
    const numVal = parseNumeric(value);
    if (numVal === null) return value;
    
    const isBest = bestValues[col.key] !== undefined && numVal === bestValues[col.key];
    const isGood = !isBest && topTier[col.key] !== undefined && (
      lowerIsBetter.includes(col.key) ? numVal <= topTier[col.key] : numVal >= topTier[col.key]
    );
    
    return <PerformanceBadge value={value} isBest={isBest} isGood={isGood} />;
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
      <table className="w-full text-sm border-collapse bg-white">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="px-4 py-3 text-left cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap font-medium text-gray-900 border-b border-gray-200"
              >
                <div className="flex items-center">
                  {col.label}
                  <SortArrow direction={sortCol === col.key ? sortDir : null} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sorted.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-3 whitespace-nowrap">
                  {getCellContent(col, row)}
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Voice AI Benchmarks</h1>
            <p className="mt-2 text-lg text-gray-600">Compare STT and LLM providers for voice agents</p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Live data from upstream repos
              </span>
              <span>•</span>
              <span>Updated daily</span>
              <span>•</span>
              <span>{sttData.length} STT providers</span>
              <span>•</span>
              <span>{llmData.length} LLM models</span>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200 px-6">
          <div className="max-w-7xl mx-auto">
            <nav className="-mb-px flex gap-0">
              <button
                onClick={() => setTab('stt')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                  tab === 'stt'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🎤 STT Benchmarks
              </button>
              <button
                onClick={() => setTab('llm')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200 ${
                  tab === 'llm'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🧠 LLM for Voice Agents
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {tab === 'stt' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>STT Performance:</strong> Benchmarked on 1,000 samples from pipecat-ai/smart-turn-data-v3.1-train. 
                    Lower WER (Word Error Rate) and TTFS (Time To Final Segment) values indicate better performance. 
                    🏆 = Best in category, badges highlight top 20% performers.
                  </p>
                </div>
                <DataTable
                  columns={sttColumns}
                  data={sttData}
                  defaultSort="pooled_wer"
                  lowerIsBetter={sttLowerIsBetter}
                />
              </div>
            )}
            {tab === 'llm' && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <p className="text-sm text-purple-800">
                    <strong>LLM Voice Agent Evaluation:</strong> Multi-turn conversation benchmark (aiwf_medium_context). 
                    Higher pass rates indicate better conversation handling. Lower TTFT (Time To First Token) is faster response. 
                    🏆 = Best performer, badges show top-tier models.
                  </p>
                </div>
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
        <footer className="bg-white border-t border-gray-200 px-6 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="text-sm text-gray-600">
                  Data sourced from{' '}
                  <a href="https://github.com/pipecat-ai/stt-benchmark" className="font-medium text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener">
                    pipecat-ai/stt-benchmark
                  </a>
                  {' '}and{' '}
                  <a href="https://github.com/kwindla/aiewf-eval" className="font-medium text-blue-600 hover:text-blue-700 underline" target="_blank" rel="noopener">
                    kwindla/aiewf-eval
                  </a>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Built for the Pipecat community • Updated daily via GitHub Actions
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-1">
                    P
                  </div>
                  <span className="text-xs text-gray-600">Pipecat</span>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm mb-1">
                    AWS
                  </div>
                  <span className="text-xs text-gray-600">Powered by</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}