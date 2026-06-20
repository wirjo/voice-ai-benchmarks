import { useState, useMemo } from 'react';
import Head from 'next/head';
import sttData from '../data/stt.json';
import llmData from '../data/llm.json';

// Icon mapping for STT vendors
const vendorIcons = {
  'AssemblyAI': 'assemblyai',
  'AWS': 'aws',
  'Azure': 'azure',
  'Cartesia': 'cartesia',
  'Deepgram': 'deepgram',
  'ElevenLabs': 'elevenlabs',
  'Google': 'google',
  'Gradium': 'gradium',
  'Mistral': 'mistral',
  'NVIDIA': 'nvidia',
  'OpenAI': 'openai',
  'Smallest AI': 'smallest',
  'Soniox': 'soniox',
  'Speechmatics': 'speechmatics',
};

// Icon mapping for LLM models (by prefix match)
function getLLMIcon(model) {
  const m = model.toLowerCase();
  if (m.includes('nemotron') || m.includes('nvidia')) return 'nvidia';
  if (m.includes('claude')) return 'anthropic';
  if (m.includes('qwen')) return 'qwen';
  if (m.includes('gemini')) return 'gemini';
  if (m.includes('gemma')) return 'gemma';
  if (m.includes('glm') || m.includes('zai-org')) return 'glm';
  if (m.includes('kimi')) return 'kimi';
  if (m.includes('gpt') || m.includes('openai')) return 'openai';
  if (m.includes('nova')) return 'aws';
  if (m.includes('groq') || m.includes('gpt-oss')) return 'groq';
  if (m.includes('mistral')) return 'mistral';
  return null;
}

function ProviderIcon({ name, type = 'stt' }) {
  const iconName = type === 'stt' ? vendorIcons[name] : getLLMIcon(name);
  if (!iconName) return null;
  return (
    <img
      src={`/voice-ai-benchmarks/icons/${iconName}.png`}
      alt={iconName}
      className="w-5 h-5 rounded-sm object-contain inline-block"
      onError={(e) => { e.target.style.display = 'none'; }}
    />
  );
}

function SortArrow({ direction }) {
  if (!direction) return <span className="text-gray-400 ml-1 text-xs">⇅</span>;
  return <span className="ml-1 text-blue-600 text-xs">{direction === 'asc' ? '▲' : '▼'}</span>;
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
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
        🏆 {value}
      </span>
    );
  }
  if (isGood) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
        {value}
      </span>
    );
  }
  return <span className="text-gray-700">{value}</span>;
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
    
    if (col.key === 'vendor') {
      return (
        <span className="font-medium text-gray-900 inline-flex items-center gap-2">
          <ProviderIcon name={value} type="stt" />
          {value}
        </span>
      );
    }
    if (col.key === 'model' && col.hasIcon) {
      return (
        <span className="font-medium text-gray-900 inline-flex items-center gap-2">
          <ProviderIcon name={value} type="llm" />
          {value}
        </span>
      );
    }
    if (col.key === 'model') {
      return <span className="font-medium text-gray-900">{value}</span>;
    }
    
    const numVal = parseNumeric(value);
    if (numVal === null) return value;
    
    const isBest = bestValues[col.key] !== undefined && numVal === bestValues[col.key];
    const isGood = !isBest && topTier[col.key] !== undefined && (
      lowerIsBetter.includes(col.key) ? numVal <= topTier[col.key] : numVal >= topTier[col.key]
    );
    
    return <PerformanceBadge value={value} isBest={isBest} isGood={isGood} />;
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl shadow-sm bg-white">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50/80">
            <th className="px-3 py-3.5 text-center font-medium text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200 w-10">
              #
            </th>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="px-4 py-3.5 text-left cursor-pointer hover:bg-gray-100 select-none whitespace-nowrap font-medium text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200"
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  <SortArrow direction={sortCol === col.key ? sortDir : null} />
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sorted.map((row, i) => (
            <tr key={i} className="hover:bg-blue-50/30 transition-colors">
              <td className="px-3 py-3 text-center text-xs font-medium text-gray-400 w-10">
                {i + 1}
              </td>
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

function StatCard({ icon, value, label }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
      <span className="text-lg">{icon}</span>
      <div>
        <div className="text-sm font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500">{label}</div>
      </div>
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
  { key: 'model', label: 'Model', hasIcon: true },
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
        <link rel="icon" href="/voice-ai-benchmarks/favicon.ico" />
        <link
          rel="stylesheet"
          href="https://fonts.cdnfonts.com/css/amazon-ember"
        />
      </Head>

      <div className="min-h-screen flex flex-col bg-gray-50 font-ember">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-10">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Voice AI Benchmarks</h1>
            <p className="mt-3 text-lg text-gray-600">Compare STT and LLM providers for voice agents</p>
          </div>
        </header>

        {/* Stats Bar */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-5">
          <div className="max-w-7xl mx-auto flex flex-wrap gap-3">
            <StatCard icon="🟢" value="Live Data" label="From upstream repos" />
            <StatCard icon="🔄" value="Updated Daily" label="GitHub Actions" />
            <StatCard icon="🎤" value={`${sttData.length} Providers`} label="STT Services" />
            <StatCard icon="🧠" value={`${llmData.length} Models`} label="LLM Evaluation" />
          </div>
        </div>

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
                <p className="text-sm text-gray-500 leading-relaxed">
                  Benchmarked on 1,000 samples from pipecat-ai/smart-turn-data-v3.1-train. 
                  Lower WER (Word Error Rate) and TTFS (Time To Final Segment) is better. 
                  🏆 = Best in category.
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
              <div className="space-y-6">
                <p className="text-sm text-gray-500 leading-relaxed">
                  Multi-turn conversation benchmark (aiwf_medium_context). 
                  Higher pass rates indicate better conversation handling. Lower TTFT (Time To First Token) is faster. 
                  🏆 = Best performer.
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
        <footer className="bg-white border-t border-gray-200 px-6 py-12 mt-auto">
          <div className="max-w-7xl mx-auto">
            {/* Logos */}
            <div className="flex items-center justify-center gap-10 mb-8">
              <a href="https://pipecat.ai" target="_blank" rel="noopener" className="opacity-70 hover:opacity-100 transition-opacity">
                <img 
                  src="/voice-ai-benchmarks/pipecat-logo.png" 
                  alt="Pipecat" 
                  className="h-10 w-10 rounded-lg"
                />
              </a>
              <a href="https://aws.amazon.com" target="_blank" rel="noopener" className="opacity-70 hover:opacity-100 transition-opacity">
                <img 
                  src="/voice-ai-benchmarks/aws-official.png" 
                  alt="AWS" 
                  className="h-10 rounded"
                />
              </a>
            </div>

            {/* Made with love */}
            <div className="text-center mb-6">
              <p className="text-base text-gray-700">
                Made with ❤️ for the <a href="https://pipecat.ai" target="_blank" rel="noopener" className="font-semibold text-indigo-600 hover:text-indigo-700">Pipecat</a> community
              </p>
            </div>

            {/* Data sources */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">
                Data sourced from{' '}
                <a href="https://github.com/pipecat-ai/stt-benchmark" className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2" target="_blank" rel="noopener">
                  pipecat-ai/stt-benchmark
                </a>
                {' '}and{' '}
                <a href="https://github.com/kwindla/aiewf-eval" className="font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2" target="_blank" rel="noopener">
                  kwindla/aiewf-eval
                </a>
              </p>
              <p className="text-xs text-gray-400">
                Updated daily via GitHub Actions • Open source
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}