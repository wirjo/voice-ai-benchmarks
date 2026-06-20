# Voice AI Benchmarks Dashboard

A clean, interactive dashboard for comparing Voice AI providers across STT (Speech-to-Text) and LLM (Large Language Model) metrics for voice agent applications.

## 🚀 Live Demo

Visit: [voice-ai-benchmarks.vercel.app](https://voice-ai-benchmarks.vercel.app)

## 📊 Data Sources

- **STT Benchmarks**: [pipecat-ai/stt-benchmark](https://github.com/pipecat-ai/stt-benchmark)
- **LLM Evaluation**: [kwindla/aiewf-eval](https://github.com/kwindla/aiewf-eval)

Data is automatically updated daily via GitHub Actions.

## 🔧 Features

- **Interactive Tables**: Sort by any metric, best values highlighted
- **Two Benchmark Categories**:
  - STT: Latency (TTFS) and accuracy (WER) metrics
  - LLM: Multi-turn conversation evaluation (pass rate, tool use, TTFT)
- **Mobile Responsive**: Clean design that works on all devices
- **Daily Updates**: Automatic data refresh from upstream repos

## 🏗 Development

```bash
# Install dependencies
npm install

# Fetch latest benchmark data
npm run fetch-data

# Start development server
npm run dev

# Build for production
npm run build
```

## 📈 Metrics Explained

### STT Benchmarks
- **TTFS**: Time To Final Segment (lower = faster response)
- **WER**: Word Error Rate (lower = more accurate)
- **Perfect**: Percentage of perfect transcriptions
- **P95/P99**: 95th/99th percentile latency (worst-case performance)

### LLM for Voice Agents
- **Pass Rate**: Overall conversation success rate (higher = better)
- **Tool Use**: Function calling accuracy (higher = better)
- **TTFT**: Time To First Token (lower = faster response)
- **KB Ground**: Knowledge base grounding accuracy

## 🏢 Built For

The [Pipecat](https://pipecat.ai) community and voice AI developers who need data-driven provider comparisons.

---

**Sponsored by**: Pipecat AI × AWS