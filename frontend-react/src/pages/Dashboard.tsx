import React from 'react';
import { 
  CloudSun, 
  Thermometer, 
  Droplets, 
  Wind, 
  Navigation, 
  CloudRain, 
  Gauge, 
  Sun,
  LayoutDashboard,
  BarChart2,
  Settings,
  LogOut,
  Activity,
  Compass,
  Table
} from 'lucide-react';
import RealTimeTable from '../components/RealTimeTable';
import WindroseAnalytics from '../components/WindroseAnalytics';
import MetricCard from '../components/MetricCard';
import RealTimeChart from '../components/RealTimeChart';
import HistoricalFilters from '../components/HistoricalFilters';
import AnalyticsResults from '../components/AnalyticsResults';
import { useAuthStore } from '../store/useAuthStore';
import { useWeatherStore } from '../store/useWeatherStore';
import { useWeatherSocket } from '../hooks/useWeatherSocket';

const Dashboard: React.FC = () => {
    const { isConnected, currentFrame, minMax } = useWeatherStore();
    const [selectedParam, setSelectedParam] = React.useState('ATMP');
    
    const [analyticsResult, setAnalyticsResult] = React.useState<{ image?: string; html?: string; csv?: string; isGenerating?: boolean }>({});
    const [windroseResult, setWindroseResult] = React.useState<{ image?: string; html?: string; csv?: string; isGenerating?: boolean }>({});
    
    const { sendAction } = useWeatherSocket();

    React.useEffect(() => {
        const handleAnalytics = (e: any) => {
            const data = e.detail;
            if (data.action === 'graph_received' || data.action === 'no_data') {
                setAnalyticsResult({ 
                    image: data.image_base64, 
                    html: data.df_html,
                    csv: data.df_csv,
                    isGenerating: false 
                });
            } else if (data.action === 'windrose_received' || data.action === 'no_windrose_data') {
                setWindroseResult({
                    image: data.image_base64, 
                    html: data.df_html,
                    csv: data.df_csv,
                    isGenerating: false
                });
            }
        };

        window.addEventListener('weather_analytics_received', handleAnalytics);
        return () => window.removeEventListener('weather_analytics_received', handleAnalytics);
    }, [analyticsResult.isGenerating, windroseResult.isGenerating]);

  const metrics = [
    { label: 'Temperature', value: currentFrame?.ATMP ?? 0, unit: '°C', icon: Thermometer, color: '#3b82f6', key: 'ATMP' },
    { label: 'Humidity', value: currentFrame?.HUMD ?? 0, unit: '%', icon: Droplets, color: '#f97316', key: 'HUMD' },
    { label: 'Wind Speed', value: currentFrame?.WSPD ?? 0, unit: 'm/s', icon: Wind, color: '#14b8a6', key: 'WSPD' },
    { label: 'Wind Dir', value: currentFrame?.WDIR ?? 0, unit: '°', icon: Navigation, color: '#ec4899', key: 'WDIR' },
    { label: 'Rainfall', value: currentFrame?.RAIN ?? 0, unit: 'mm', icon: CloudRain, color: '#3b82f6', key: 'RAIN' },
    { label: 'BP', value: currentFrame?.BPRS ?? 0, unit: 'mBar', icon: Gauge, color: '#8b5cf6', key: 'BPRS' },
    { label: 'Solar Rad', value: currentFrame?.SRAD ?? 0, unit: 'W/m²', icon: Sun, color: '#fbbf24', key: 'SRAD' },
  ];

  const { logout } = useAuthStore();

  const handleHistoricalAnalysis = (type: 'line' | 'area', params: any) => {
    setAnalyticsResult({ isGenerating: true });
    setTimeout(() => {
        document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    if (type === 'line') {
      sendAction('get_line_chart', { daterange: params.daterange, params: params.params });
    } else if (type === 'area') {
      sendAction('get_area_chart', { daterange: params.daterange, value: params.value });
    }
  };

  const handleWindroseAnalysis = (params: any) => {
    setWindroseResult({ isGenerating: true });
    setTimeout(() => {
        document.getElementById('windrose')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    sendAction('get_windrose', { daterange: params.daterange, values: params.values, colors: params.colors });
  };

  return (
    <div className="flex h-screen bg-bg font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col z-10">
        <div className="p-10 border-b border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary-900 flex items-center justify-center text-white">
            <CloudSun size={28} />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-medium text-lg leading-tight text-primary-900 uppercase tracking-tighter">Weather</span>
            <span className="font-display font-bold text-lg leading-tight text-primary-900 uppercase tracking-tighter">Monitor</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => document.getElementById('dashboard-top')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 font-bold text-xs uppercase tracking-widest transition-all"
          >
            <LayoutDashboard size={16} />
            Overview
          </button>
          <button 
            onClick={() => document.getElementById('live-chart')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 font-bold text-xs uppercase tracking-widest transition-all"
          >
            <Activity size={16} />
            Live Chart
          </button>
          <button 
            onClick={() => document.getElementById('data-log')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 font-bold text-xs uppercase tracking-widest transition-all"
          >
            <Table size={16} />
            Data Log
          </button>
          <button 
            onClick={() => document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 font-bold text-xs uppercase tracking-widest transition-all"
          >
            <BarChart2 size={16} />
            Analytics
          </button>
          <button 
            onClick={() => document.getElementById('windrose')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 font-bold text-xs uppercase tracking-widest transition-all"
          >
            <Compass size={16} />
            Windrose
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 font-bold text-xs uppercase tracking-widest transition-all">
            <Settings size={16} />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 font-bold text-xs uppercase tracking-widest transition-all"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-16 bg-bg scroll-smooth">
        <header id="dashboard-top" className="mb-12 flex justify-between items-end border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-4xl font-display font-medium text-slate-900 tracking-tighter">System Overview</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Station: RS485-PROD-01</p>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 px-6 py-3 border border-slate-200">
            <div className={`w-2 h-2 ${isConnected ? 'bg-primary-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              {isConnected ? 'Link Active' : 'Link Offline'}
            </span>
          </div>
        </header>

        {/* Grid of Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {metrics.map((metric) => (
            <MetricCard
              key={metric.key}
              label={metric.label}
              value={metric.value}
              unit={metric.unit}
              icon={metric.icon}
              color={metric.color}
              min={minMax[metric.key]?.min}
              max={minMax[metric.key]?.max}
              timestamp={currentFrame?.RTC}
            />
          ))}
        </div>

        {/* Real-Time Table Row */}
        <div id="data-log" className="mb-12 pt-4">
          <RealTimeTable />
        </div>

        {/* Charts Row */}
        <div id="live-chart" className="mb-12 pt-4">
          <div className="bg-white p-8 border border-slate-200 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-4">
              <h3 className="font-display font-bold text-xs text-primary-900 uppercase tracking-[0.2em] flex items-center gap-2">
                <BarChart2 className="text-primary-500" size={16} />
                Live: {metrics.find(m => m.key === selectedParam)?.label}
              </h3>
              <select 
                value={selectedParam}
                onChange={(e) => setSelectedParam(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider px-3 py-2 outline-none focus:border-primary-500 transition-all"
              >
                {metrics.map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <RealTimeChart 
                parameter={selectedParam} 
                label={metrics.find(m => m.key === selectedParam)?.label ?? ''}
                color={metrics.find(m => m.key === selectedParam)?.color ?? '#3b82f6'}
              />
            </div>
          </div>
        </div>

        {/* Analytical Engine Configs (Separate Sections) */}
        
        <div id="analytics" className="border-t border-slate-100 pt-12 pb-12">
          <h2 className="text-xl font-display font-medium text-slate-900 tracking-tight uppercase mb-8">Analytical Engine</h2>
          <HistoricalFilters 
            availableParams={metrics.map(m => ({ key: m.key, label: m.label }))}
            onApply={handleHistoricalAnalysis}
          />
          <div className="mt-8">
            <AnalyticsResults 
              imageBase64={analyticsResult.image}
              tableHtml={analyticsResult.html}
              tableCsv={analyticsResult.csv}
              isGenerating={analyticsResult.isGenerating}
            />
          </div>
        </div>

        <div id="windrose" className="border-t border-slate-100 pt-12 pb-12">
           <h2 className="text-xl font-display font-medium text-slate-900 tracking-tight uppercase mb-8">Aerodynamic Analysis</h2>
           <WindroseAnalytics 
            onApply={handleWindroseAnalysis}
          />
          <div className="mt-8">
            <AnalyticsResults 
              imageBase64={windroseResult.image}
              tableHtml={windroseResult.html}
              tableCsv={windroseResult.csv}
              isGenerating={windroseResult.isGenerating}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

