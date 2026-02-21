import React from 'react';
import { Download, LayoutDashboard } from 'lucide-react';

interface AnalyticsResultsProps {
  imageBase64?: string;
  tableHtml?: string;
  tableCsv?: string;
  isGenerating?: boolean;
}

const AnalyticsResults: React.FC<AnalyticsResultsProps> = ({ 
  imageBase64, 
  tableHtml, 
  tableCsv,
  isGenerating
}) => {
  if (!imageBase64 && !isGenerating && !tableHtml) {
    return null;
  }

  const handleExportCsv = () => {
    if (!tableCsv) return;
    const blob = new Blob([tableCsv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytical_data_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="mt-8 bg-white border border-slate-200">
      <div className="flex justify-between items-center p-6 border-b border-slate-100">
        <h3 className="font-display font-bold text-sm text-primary-900 uppercase tracking-[0.2em] flex items-center gap-3">
          <LayoutDashboard className="text-primary-500" size={18} />
          Analytical Engine Results
        </h3>
        
        {tableCsv && (
          <button 
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] uppercase tracking-widest transition-colors"
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      <div className="p-8">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-primary-500 rounded-full animate-spin mb-6"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">
              Generating Vector Topology...
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Visual Chart Result */}
            {imageBase64 && (
              <div className="bg-bg p-8 border border-slate-100 flex justify-center">
                <img 
                  src={`data:image/png;base64,${imageBase64}`} 
                  alt="Analytical Plot" 
                  className="max-w-full h-auto max-h-[600px] object-contain shadow-sm"
                />
              </div>
            )}

            {/* Tabular Data Result */}
            {tableHtml && (
              <div className="w-full overflow-x-auto border border-slate-100 rounded-sm">
                <style dangerouslySetInnerHTML={{__html: `
                  .pandas-table-wrapper table {
                    width: 100%;
                    border-collapse: collapse;
                    text-align: left;
                    font-size: 11px;
                  }
                  .pandas-table-wrapper th, 
                  .pandas-table-wrapper td {
                    padding: 12px 16px;
                    border-bottom: 1px solid #f1f5f9;
                    white-space: nowrap;
                  }
                  .pandas-table-wrapper th {
                    background-color: #f8fafc;
                    color: #475569;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                  }
                  .pandas-table-wrapper tr:last-child td {
                    border-bottom: none;
                  }
                  .pandas-table-wrapper tr:hover td {
                    background-color: #f8fafc;
                  }
                `}} />
                <div 
                  className="pandas-table-wrapper text-slate-700 font-medium"
                  dangerouslySetInnerHTML={{ __html: tableHtml }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsResults;
