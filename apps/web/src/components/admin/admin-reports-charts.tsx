'use client';

import {
  TrendingUp,
  Briefcase,
  DollarSign,
  Shield,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-dt-border bg-dt-surface px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-dt-text">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-xs" style={{ color: item.color }}>
          {item.name}:{' '}
          {typeof item.value === 'number'
            ? item.name.toLowerCase().includes('revenue') ||
              item.name.toLowerCase().includes('value')
              ? `$${item.value.toLocaleString()}`
              : item.value.toLocaleString()
            : item.value}
        </p>
      ))}
    </div>
  );
}

export interface ReportsChartsProps {
  trends: Array<{ month: string; users: number; jobs: number; contracts: number; revenue: number }> | undefined;
  loadingTrends: boolean;
  jobPipelineData: Array<{ name: string; value: number; fill: string }>;
  disputeData: Array<{ name: string; value: number }>;
  platformHealthData: Array<{ name: string; value: number; fill: string }>;
  activeUsers: number;
  totalReviews: number;
  messagesThisMonth: number;
}

export function ReportsCharts({
  trends,
  loadingTrends,
  jobPipelineData,
  disputeData,
  platformHealthData,
  activeUsers,
  totalReviews,
  messagesThisMonth,
}: ReportsChartsProps) {
  return (
    <>
      {/* Growth Trends */}
      <Card className="border-dt-border bg-dt-surface shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base text-dt-text">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Growth Trends (6 Months)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTrends ? (
            <div className="flex h-[300px] items-center justify-center">
              <Spinner size="md" />
            </div>
          ) : trends && trends.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-dt-text-muted" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-dt-text-muted" />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="users" name="Users" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="jobs" name="Jobs" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="contracts" name="Contracts" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[300px] items-center justify-center text-sm text-dt-text-muted">No data</div>
          )}
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-dt-text">
              <DollarSign className="h-5 w-5 text-violet-500" />
              Revenue by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trends && trends.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-dt-text-muted" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-dt-text-muted" />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#8b5cf6" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-dt-text-muted">No data</div>
            )}
          </CardContent>
        </Card>

        {/* Job Pipeline */}
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-dt-text">
              <Briefcase className="h-5 w-5 text-emerald-500" />
              Job Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={jobPipelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-dt-text-muted" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-dt-text-muted" allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Jobs" radius={[6, 6, 0, 0]} barSize={40}>
                    {jobPipelineData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Dispute Distribution */}
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-dt-text">
              <Shield className="h-5 w-5 text-amber-500" />
              Dispute Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {disputeData.length > 0 ? (
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={disputeData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                      {disputeData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-dt-text-muted">No disputes</div>
            )}
          </CardContent>
        </Card>

        {/* Platform Health */}
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-dt-text">
              <Activity className="h-5 w-5 text-emerald-500" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-2">
              {platformHealthData.map((metric) => (
                <div key={metric.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-dt-text-muted">{metric.name}</span>
                    <span className="font-medium text-dt-text">{metric.value}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(metric.value, 100)}%`, backgroundColor: metric.fill }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/50">
                  <p className="text-lg font-bold text-dt-text">{activeUsers}</p>
                  <p className="text-xs text-dt-text-muted">Active Users</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/50">
                  <p className="text-lg font-bold text-dt-text">{totalReviews}</p>
                  <p className="text-xs text-dt-text-muted">Reviews</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-center dark:bg-slate-800/50">
                  <p className="text-lg font-bold text-dt-text">{messagesThisMonth}</p>
                  <p className="text-xs text-dt-text-muted">Msgs/Mo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
