import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CrowdChartProps {
  hourlyCrowd: number[]; // 24 values
  currentHour?: number;
  placeName?: string;
}

export const CrowdChart: React.FC<CrowdChartProps> = ({
  hourlyCrowd,
  currentHour = new Date().getHours(),
  placeName,
}) => {
  const { t } = useTranslation();

  const chartData = (hourlyCrowd && hourlyCrowd.length === 24
    ? hourlyCrowd
    : Array(24).fill(0.3)
  ).map((val, hour) => {
    const hourLabel = `${hour.toString().padStart(2, '0')}:00`;
    return {
      hour: hourLabel,
      hourNum: hour,
      crowdPercent: Math.round(val * 100),
      raw: val,
    };
  });

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 sm:p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-orange-400" />
          <h4 className="text-xs sm:text-sm font-semibold text-slate-200">
            {placeName ? `${placeName} — ` : ''}{t('itinerary.crowd_trend')}
          </h4>
        </div>
        <span className="text-[10px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
          {t('typical_pattern_note')}
        </span>
      </div>

      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="crowdGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hour"
              stroke="#64748b"
              fontSize={10}
              interval={3}
              tickLine={false}
            />
            <YAxis
              stroke="#64748b"
              fontSize={10}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700 text-xs p-2 rounded shadow-lg">
                      <p className="font-semibold text-slate-200">{data.hour}</p>
                      <p className="text-orange-400">
                        Density: {data.crowdPercent}%{' '}
                        <span className="text-slate-400">
                          ({data.crowdPercent > 70 ? 'Peak' : data.crowdPercent > 40 ? 'Moderate' : 'Low'})
                        </span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              x={`${currentHour.toString().padStart(2, '0')}:00`}
              stroke="#38bdf8"
              strokeDasharray="3 3"
              label={{
                value: 'Now',
                fill: '#38bdf8',
                fontSize: 10,
                position: 'top',
              }}
            />
            <Area
              type="monotone"
              dataKey="crowdPercent"
              stroke="#f97316"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#crowdGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-[10px] text-slate-500 text-center mt-1">
        Modeled Pune diurnal visitation frequency. Values reflect historic footfall patterns.
      </p>
    </div>
  );
};
