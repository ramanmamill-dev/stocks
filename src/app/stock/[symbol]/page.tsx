import type { Metadata } from 'next';
import { sanitizeSymbol } from '@/lib/validators';

interface Props {
  params: { symbol: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const symbol = params.symbol.replace('.NS', '').replace('.BO', '');
  return {
    title: `${symbol} – StockSignal AI`,
    description: `View real-time signals, charts, and analysis for ${symbol}`,
  };
}

export default async function StockDetailPage({ params }: Props) {
  let symbol: string;
  try {
    symbol = sanitizeSymbol(params.symbol);
  } catch {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h1 className="text-xl font-semibold text-red-700">Invalid Symbol</h1>
          <p className="text-red-600 mt-2">
            &quot;{params.symbol}&quot; is not a valid stock symbol. Use format: SYMBOL.NS or SYMBOL.BO
          </p>
        </div>
      </div>
    );
  }

  const baseSymbol = symbol.replace('.NS', '').replace('.BO', '');

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-[#787B86] hover:text-[#0B0E11] transition-colors"
        >
          Back
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0B0E11]">{baseSymbol}</h1>
            <p className="text-sm text-[#787B86]">{symbol}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#787B86]">Loading data...</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6 min-h-[400px]">
          <h2 className="text-lg font-semibold mb-4">Price Chart</h2>
          <div className="flex items-center justify-center h-64 text-[#787B86]">
            Chart coming in Chunk 11
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6">
            <h2 className="text-lg font-semibold mb-4">Signal</h2>
            <p className="text-[#787B86]">Signal data coming in Chunk 11</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[#E0E3EB] p-6">
            <h2 className="text-lg font-semibold mb-4">Key Indicators</h2>
            <p className="text-[#787B86]">Indicators coming in Chunk 11</p>
          </div>
        </div>
      </div>
    </div>
  );
}
