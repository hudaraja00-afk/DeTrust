'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  Briefcase,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { MonthlyTrend } from '@/lib/api/admin';

// =============================================================================
// SHARED CHART TOOLTIP
// =============================================================================

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
          {item.name}: {typeof item.value === 'number' && item.name.toLowerCase().includes('revenue')
            ? `$${item.value.toLocaleString()}`
            : item.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

// =============================================================================
// PIE CHART COLORS
// =============================================================================

const JOB_COLORS = ['#22c55e', '#3b82f6', '#eab308', '#f43f5e', '#8b5cf6', '#64748b'];
const USER_COLORS = ['#3b82f6', '#22c55e', '#f59e0b'];

// =============================================================================
// PUBLIC TYPES
// =============================================================================

export interface AdminChartsProps {
  trends?: MonthlyTrend[];
  loadingTrends: boolean;
  jobStatusData: Array<{ name: string; value: number }>;
  userRoleData: Array<{ name: string; value: number }>;
}

// =============================================================================
// CHARTS SECTION
// =============================================================================

export function AdminCharts({ trends, loadingTrends, jobStatusData, userRoleData }: AdminChartsProps) {
  return (
    <>
      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Monthly Trends - Area Chart */}
        <Card className="border-dt-border bg-dt-surface shadow-lg lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-dt-text">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Monthly Trends (6 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
              <div className="flex h-[280px] items-center justify-center"><Spinner size="md" /></div>
            ) : trends && trends.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorJobs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorContracts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-dt-text-muted" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-dt-text-muted" />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="users" name="Users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={2} />
                    <Area type="monotone" dataKey="jobs" name="Jobs" stroke="#22c55e" fillOpacity={1} fill="url(#colorJobs)" strokeWidth={2} />
                    <Area type="monotone" dataKey="contracts" name="Contracts" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorContracts)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-dt-text-muted">No trend data available</div>
            )}
          </CardContent>
        </Card>

        {/* User Distribution - Pie Chart */}
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-dt-text">
              <Users className="h-5 w-5 text-blue-500" />
              User Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userRoleData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRoleData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {userRoleData.map((_, index) => (
                        <Cell key={index} fill={USER_COLORS[index % USER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-sm text-dt-text-muted">No users yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-dt-text">
              <DollarSign className="h-5 w-5 text-violet-500" />
              Revenue Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTrends ? (
              <div className="flex h-[240px] items-center justify-center"><Spinner size="md" /></div>
            ) : trends && trends.length > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} className="fill-dt-text-muted" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-dt-text-muted" />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="revenue" name="Revenue ($)" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-dt-text-muted">No revenue data</div>
            )}
          </CardContent>
        </Card>

        {/* Job Status Distribution */}
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base text-dt-text">
              <Briefcase className="h-5 w-5 text-emerald-500" />
              Job Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {jobStatusData.length > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={jobStatusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }: { name?: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {jobStatusData.map((_, index) => (
                        <Cell key={index} fill={JOB_COLORS[index % JOB_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[240px] items-center justify-center text-sm text-dt-text-muted">No jobs yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
