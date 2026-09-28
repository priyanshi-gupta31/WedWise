import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategorySpendingSummary } from '../../types/expense';
import { formatINR } from '../../utils/currency';
import { PieChart as PieIcon } from 'lucide-react';

interface CategoryDonutChartProps {
  summaries: CategorySpendingSummary[];
}

const LUXURY_CHART_COLORS = [
  '#641F35', // Deep Royal Wine
  '#E86A5B', // Coral Terracotta
  '#D6B36A', // Champagne Gold
  '#87957D', // Soft Muted Sage
  '#F6C6B6', // Peach Blush
  '#29202A', // Dark Plum
  '#852C47', // Wine Light
  '#C85243', // Coral Dark
  '#B8944B', // Gold Dark
  '#5D6B53', // Sage Dark
  '#E2A592', // Peach Dark
  '#423444', // Plum Light
];

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ summaries }) => {
  const activeData = summaries
    .filter((s) => s.spent > 0)
    .sort((a, b) => b.spent - a.spent);

  const totalSpent = activeData.reduce((acc, curr) => acc + curr.spent, 0);

  if (activeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl border border-[#F1E4D6] text-center min-h-[240px] shadow-card">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF7ED] flex items-center justify-center text-[#641F35] mb-3">
          <PieIcon className="w-6 h-6 stroke-[1.75]" />
        </div>
        <p className="text-lg font-serif font-bold text-[#29202A]">No Category Spending Yet</p>
        <p className="text-xs text-[#615163] mt-1 max-w-xs font-sans">
          Record your first wedding advance or purchase to see proportional distribution across categories.
        </p>
      </div>
    );
  }

  const chartData = activeData.map((item, index) => {
    const percentage = totalSpent > 0 ? (item.spent / totalSpent) * 100 : 0;
    return {
      name: item.category.name,
      value: item.spent,
      percentage: percentage.toFixed(1),
      color: LUXURY_CHART_COLORS[index % LUXURY_CHART_COLORS.length],
    };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-2xl shadow-card border border-[#F1E4D6] text-xs z-50">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-semibold text-[#29202A]">{data.name}</span>
          </div>
          <p className="text-sm font-serif font-bold text-[#641F35]">{formatINR(data.value)}</p>
          <p className="text-[#8C7A8E]">{data.percentage}% of total spent</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white border border-[#F1E4D6] rounded-3xl p-6 sm:p-8 shadow-card">
      <div className="mb-4">
        <span className="text-[10px] sm:text-[11px] font-bold text-[#E86A5B] uppercase tracking-[0.2em] block mb-1">
          Proportional Allocation
        </span>
        <h4 className="text-xl sm:text-2xl font-serif font-bold text-[#29202A]">
          Where is the Wedding Budget Going?
        </h4>
        <p className="text-xs text-[#615163]">
          Proportional share of settled wedding advances and vendor arrangements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Donut Chart */}
        <div className="md:col-span-6 h-64 w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={96}
                paddingAngle={3}
                dataKey="value"
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Total text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[9px] font-bold text-[#8C7A8E] uppercase tracking-[0.2em]">
              Total Spent
            </span>
            <span className="text-lg sm:text-xl font-serif font-bold text-[#641F35] mt-0.5">
              {formatINR(totalSpent)}
            </span>
          </div>
        </div>

        {/* Category Share List */}
        <div className="md:col-span-6 space-y-1.5 max-h-60 overflow-y-auto pr-2">
          {chartData.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between text-xs p-2.5 rounded-xl hover:bg-[#FFF7ED] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-semibold text-[#29202A] truncate">{item.name}</span>
              </div>
              <div className="flex items-center gap-3 text-right flex-shrink-0">
                <span className="font-serif font-semibold text-[#29202A]">{formatINR(item.value)}</span>
                <span className="text-[#641F35] font-bold w-12 text-right">
                  {item.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
