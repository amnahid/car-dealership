'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

export type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'all';

interface DateRangeFilterProps {
  onChange: (startDate: string, endDate: string) => void;
}

export function DateRangeFilter({ onChange }: DateRangeFilterProps) {
  const t = useTranslations('Charts.DateRange');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  const [preset, setPreset] = useState<DateRangePreset>('1y');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const presetRanges: Record<DateRangePreset, { label: string; days: number }> = {
    '7d': { label: t('last7Days'), days: 7 },
    '30d': { label: t('last30Days'), days: 30 },
    '90d': { label: t('last90Days'), days: 90 },
    '1y': { label: t('lastYear'), days: 365 },
    'all': { label: t('allTime'), days: 0 },
  };

  useEffect(() => {
    if (preset === 'all') {
      onChange('', '');
      return;
    }

    const now = new Date();
    const start = new Date(now.getTime() - presetRanges[preset].days * 24 * 60 * 60 * 1000);
    onChange(start.toISOString().split('T')[0], now.toISOString().split('T')[0]);
  }, [preset]);

  const handleCustomChange = () => {
    if (customStart && customEnd) {
      onChange(customStart, customEnd);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', flexDirection: isRtl ? 'row-reverse' : 'row' }}>
      <select
        value={preset}
        onChange={(e) => setPreset(e.target.value as DateRangePreset)}
        style={{
          height: '36px',
          padding: '0 12px',
          fontSize: '14px',
          borderRadius: '4px',
          border: '1px solid #ced4da',
          background: '#fff',
        }}
      >
        {Object.entries(presetRanges).map(([value, { label }]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      {preset === 'all' && (
        <>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            style={{ height: '36px', fontSize: '14px', borderRadius: '4px', padding: '0 8px', border: '1px solid #ced4da' }}
          />
          <span style={{ color: '#9ca8b3' }}>{t('to')}</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            onBlur={handleCustomChange}
            style={{ height: '36px', fontSize: '14px', borderRadius: '4px', padding: '0 8px', border: '1px solid #ced4da' }}
          />
        </>
      )}
    </div>
  );
}

interface ChartData {
  [key: string]: string | number;
}

interface DataKeyConfig {
  key: string;
  color: string;
  name?: string;
}

interface BaseChartProps {
  height?: number;
  title?: string;
}

interface BarChartComponentProps extends BaseChartProps {
  data: ChartData[];
  dataKeys: DataKeyConfig[];
  xAxisKey: string;
  showGrid?: boolean;
  stacked?: boolean;
  horizontal?: boolean;
}

export function BarChartComponent({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  title,
  showGrid = true,
  stacked = false,
  horizontal = false,
}: BarChartComponentProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className="card" style={{ padding: '20px' }}>
      {title && <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#2a3142', textAlign: isRtl ? 'right' : 'left' }}>{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} reverseStackOrder={isRtl}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#eee" />}
          {horizontal ? (
            <>
              <XAxis type="number" fontSize={12} tickFormatter={(v) => `SAR ${v.toLocaleString()}`} orientation={isRtl ? 'top' : 'bottom'} />
              <YAxis type="category" dataKey={xAxisKey} fontSize={12} width={80} orientation={isRtl ? 'right' : 'left'} />
            </>
          ) : (
            <>
              <XAxis dataKey={xAxisKey} fontSize={12} orientation={isRtl ? 'top' : 'bottom'} />
              <YAxis fontSize={12} tickFormatter={(v) => `SAR ${v.toLocaleString()}`} orientation={isRtl ? 'right' : 'left'} />
            </>
          )}
          <Tooltip
            formatter={(value) => [`SAR ${Number(value).toLocaleString()}`, '']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #eee', textAlign: isRtl ? 'right' : 'left' }}
          />
          <Legend />
          {dataKeys.map(({ key, color, name }) => (
            <Bar
              key={key}
              dataKey={key}
              name={name || key}
              fill={color}
              stackId={stacked ? 'stack' : undefined}
              radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface LineChartComponentProps extends BaseChartProps {
  data: ChartData[];
  dataKeys: DataKeyConfig[];
  xAxisKey: string;
}

export function LineChartComponent({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  title,
}: LineChartComponentProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className="card" style={{ padding: '20px' }}>
      {title && <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#2a3142', textAlign: isRtl ? 'right' : 'left' }}>{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey={xAxisKey} fontSize={12} orientation={isRtl ? 'top' : 'bottom'} />
          <YAxis fontSize={12} tickFormatter={(v) => `SAR ${v.toLocaleString()}`} orientation={isRtl ? 'right' : 'left'} />
          <Tooltip
            formatter={(value) => [`SAR ${Number(value).toLocaleString()}`, '']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #eee', textAlign: isRtl ? 'right' : 'left' }}
          />
          <Legend />
          {dataKeys.map(({ key, color, name }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={name || key}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface AreaChartComponentProps extends BaseChartProps {
  data: ChartData[];
  dataKeys: DataKeyConfig[];
  xAxisKey: string;
}

export function AreaChartComponent({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  title,
}: AreaChartComponentProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className="card" style={{ padding: '20px' }}>
      {title && <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#2a3142', textAlign: isRtl ? 'right' : 'left' }}>{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey={xAxisKey} fontSize={12} orientation={isRtl ? 'top' : 'bottom'} />
          <YAxis fontSize={12} tickFormatter={(v) => `SAR ${v.toLocaleString()}`} orientation={isRtl ? 'right' : 'left'} />
          <Tooltip
            formatter={(value) => [`SAR ${Number(value).toLocaleString()}`, '']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #eee', textAlign: isRtl ? 'right' : 'left' }}
          />
          <Legend />
          {dataKeys.map(({ key, color, name }) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={name || key}
              stroke={color}
              fill={color}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const PIE_COLORS = ['#28aaa9', '#2b2d5d', '#42ca7f', '#f8b425', '#ec4561', '#38a4f8', '#9c27b0', '#ff5722'];

interface PieChartComponentProps extends BaseChartProps {
  data: { name: string; value: number }[];
  donut?: boolean;
}

export function PieChartComponent({
  data,
  height = 300,
  title,
  donut = false,
}: PieChartComponentProps) {
  const t = useTranslations('Charts');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ padding: '20px' }}>
        {title && <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#2a3142', textAlign: isRtl ? 'right' : 'left' }}>{title}</h4>}
        <p style={{ color: '#9ca8b3', textAlign: 'center' }}>{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '20px' }}>
      {title && <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#2a3142', textAlign: isRtl ? 'right' : 'left' }}>{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={donut ? 80 : 100}
            innerRadius={donut ? 50 : 0}
            label={!donut}
            labelLine={!donut}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => {
              const num = typeof value === 'number' ? value : Number(value) || 0;
              return [`SAR ${num.toLocaleString()}`, ''];
            }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #eee', textAlign: isRtl ? 'right' : 'left' }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface ComboChartComponentProps extends BaseChartProps {
  data: ChartData[];
  bars: DataKeyConfig[];
  lines?: DataKeyConfig[];
  xAxisKey: string;
}

export function ComboChartComponent({
  data,
  bars,
  lines = [],
  xAxisKey,
  height = 300,
  title,
}: ComboChartComponentProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className="card" style={{ padding: '20px' }}>
      {title && <h4 style={{ marginTop: 0, marginBottom: '16px', color: '#2a3142', textAlign: isRtl ? 'right' : 'left' }}>{title}</h4>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey={xAxisKey} fontSize={12} orientation={isRtl ? 'top' : 'bottom'} />
          <YAxis fontSize={12} tickFormatter={(v) => `SAR ${v.toLocaleString()}`} orientation={isRtl ? 'right' : 'left'} />
          <Tooltip
            formatter={(value) => [`SAR ${Number(value).toLocaleString()}`, '']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #eee', textAlign: isRtl ? 'right' : 'left' }}
          />
          <Legend />
          {bars.map(({ key, color, name }) => (
            <Bar key={key} dataKey={key} name={name || key} fill={color} radius={[4, 4, 0, 0]} />
          ))}
          {lines.map(({ key, color, name }) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={name || key}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
