import { TrendingUp, Activity, BarChart3, PieChart, CheckCircle2, FlaskConical } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  AreaChart,
  Area,
  LabelList,
  Legend
} from 'recharts';

interface StructuredVisualizerProps {
  data: {
    answer: string;
    market_growth: number;
    success_rate: number;
    clinical_phase: string;
    yearly_projections: number[];
    competitor_split: {
      leaders: number;
      innovators: number;
      disruptors: number;
    };
  };
}

export default function StructuredVisualizer({ data }: StructuredVisualizerProps) {
  const projectionData = data.yearly_projections.map((val, idx) => ({
    year: `Year ${idx + 1}`,
    value: val
  }));

  const competitorData = [
    { name: 'Leaders', value: data.competitor_split.leaders, color: '#6366f1' },
    { name: 'Innovators', value: data.competitor_split.innovators, color: '#ec4899' },
    { name: 'Disruptors', value: data.competitor_split.disruptors, color: '#14b8a6' },
  ];

  return (
    <div className="space-y-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-md">
          <div className="flex items-center space-x-4 mb-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Market Growth</span>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-black text-slate-900 dark:text-white">{data.market_growth}%</span>
            <span className="text-sm font-medium text-green-500">YoY</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-md">
          <div className="flex items-center space-x-4 mb-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-xl">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Success Rate</span>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-black text-slate-900 dark:text-white">{data.success_rate}%</span>
            <span className="text-sm font-medium text-purple-400 font-mono">PROBABILITY</span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-md">
          <div className="flex items-center space-x-4 mb-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
              <FlaskConical className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Clinical Phase</span>
          </div>
          <div className="flex items-baseline space-x-3">
            <span className="text-4xl font-black text-slate-900 dark:text-white">{data.clinical_phase}</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Projections Chart */}
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-md flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <BarChart3 className="w-7 h-7 text-indigo-500" />
              <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">Growth Projections</h4>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 30, right: 40, left: 15, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: 'none', 
                    borderRadius: '16px',
                    fontSize: '14px',
                    padding: '12px',
                    color: '#fff' 
                  }}
                  itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                  formatter={(val: any) => [`${val}M`, 'Revenue (est.)']}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingBottom: '20px' }}
                />
                <Area 
                  name="Revenue Projection (Millions)"
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  strokeWidth={4}
                  dot={{ r: 6, fill: '#6366f1', strokeWidth: 3, stroke: '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                >
                  <LabelList dataKey="value" position="top" offset={15} style={{ fontSize: '13px', fill: '#6366f1', fontWeight: 'bold' }} />
                </Area>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Competitor Split */}
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 shadow-md flex flex-col h-[500px]">
          <div className="flex items-center space-x-4 mb-8">
            <PieChart className="w-7 h-7 text-rose-500" />
            <h4 className="text-xl font-bold text-slate-800 dark:text-slate-200">Market Share Split</h4>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={competitorData} layout="vertical" margin={{ top: 10, right: 60, left: 15, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.1} />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 700 }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ 
                    backgroundColor: '#0f172a', 
                    border: 'none', 
                    borderRadius: '16px',
                    fontSize: '14px',
                    padding: '12px'
                  }}
                  formatter={(val: any) => [`${val}%`, 'Market Share']}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right" 
                  iconType="rect"
                  wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingBottom: '20px' }}
                />
                <Bar name="Market Share %" dataKey="value" radius={[0, 6, 6, 0]} barSize={30}>
                  {competitorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                  <LabelList dataKey="value" position="right" style={{ fontSize: '13px', fill: '#94a3b8', fontWeight: 'bold' }} formatter={(val: any) => `${val}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Summary Recap */}
      <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 text-lg italic text-slate-600 dark:text-indigo-300 flex items-start gap-4">
        <CheckCircle2 className="w-7 h-7 text-indigo-500 shrink-0 mt-0.5" />
        <p className="font-medium">Market projections are based on current adoption rates and competitor dynamics. Clinical phase refers to the current highest successful milestone.</p>
      </div>
    </div>
  );
}
