'use client';

import { Settings, Shield, Globe, Database, Mail, Blocks, Server, Info } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SettingRowProps {
  label: string;
  value: string;
  description?: string;
  badge?: { text: string; color: string };
}

function SettingRow({ label, value, description, badge }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-dt-border p-4 transition hover:bg-dt-surface-alt">
      <div>
        <p className="text-sm font-medium text-dt-text">{label}</p>
        {description && <p className="mt-0.5 text-xs text-dt-text-muted">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-dt-text-muted">{value}</span>
        {badge && <Badge className={cn('text-xs', badge.color)}>{badge.text}</Badge>}
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-dt-text">
          <Settings className="h-6 w-6 text-slate-500" />
          Platform Settings
        </h1>
        <p className="mt-1 text-sm text-dt-text-muted">
          View platform configuration. Settings are managed via environment variables for security.
        </p>
      </div>

      {/* Smart Contract Settings */}
      <Card className="border-dt-border bg-dt-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-dt-text">
            <Blocks className="h-5 w-5 text-violet-500" />
            Smart Contract Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingRow
            label="Platform Fee"
            value="1–3%"
            description="Smart contract enforces MAX_PLATFORM_FEE = 10% hard ceiling"
            badge={{ text: 'On-chain', color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' }}
          />
          <SettingRow
            label="Chain"
            value="Hardhat Local (31337)"
            description="All contracts deployed to localhost:8545"
            badge={{ text: 'Development', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }}
          />
          <SettingRow
            label="Milestone Auto-Approve"
            value="7 days"
            description="Client has 7 days to review; no action = auto-approved"
          />
          <SettingRow
            label="Voting Deadline"
            value="7 days"
            description="Dispute voting window for jurors"
          />
        </CardContent>
      </Card>

      {/* Platform Rules */}
      <Card className="border-dt-border bg-dt-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-dt-text">
            <Shield className="h-5 w-5 text-emerald-500" />
            Business Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingRow label="Juror Eligibility" value="Trust > 50" description="Must have zero prior work history with either dispute party" />
          <SettingRow label="Profile Gate" value="70%" description="Freelancer profile must be ≥70% complete to submit proposals" />
          <SettingRow label="Double-Blind Reviews" value="14 days" description="Neither party sees the other's review until both submit or window closes" />
          <SettingRow label="Skill Test Cooldown" value="30 days" description="One attempt per skill per 30 days" />
          <SettingRow label="Max Evidence Files" value="5 files, 25MB" description="Dispute evidence upload limits" />
          <SettingRow label="Admin Jury Override" value="Not allowed" description="Admin can suspend users but cannot reverse jury verdict" />
        </CardContent>
      </Card>

      {/* Infrastructure */}
      <Card className="border-dt-border bg-dt-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-dt-text">
            <Server className="h-5 w-5 text-blue-500" />
            Infrastructure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingRow
            label="API Server"
            value="Port 4000"
            badge={{ text: 'Express', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }}
          />
          <SettingRow
            label="Frontend"
            value="Port 3000"
            badge={{ text: 'Next.js 15', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }}
          />
          <SettingRow
            label="Database"
            value="PostgreSQL 5432"
            badge={{ text: 'Prisma ORM', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' }}
          />
          <SettingRow
            label="Cache"
            value="Redis 6379"
          />
          <SettingRow
            label="Blockchain"
            value="Hardhat 8545"
            badge={{ text: 'Local', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }}
          />
        </CardContent>
      </Card>

      {/* Email Config */}
      <Card className="border-dt-border bg-dt-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-dt-text">
            <Mail className="h-5 w-5 text-rose-500" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingRow
            label="SMTP Provider"
            value="Google SMTP"
            description="See docs/email-setup.md for configuration"
            badge={{ text: 'TLS 587', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' }}
          />
          <SettingRow
            label="Digest Interval"
            value="15 minutes"
            description="Background job sends notification digests"
          />
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-dt-border bg-dt-surface">
        <CardContent className="flex items-start gap-3 p-4">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
          <div>
            <p className="text-sm font-medium text-dt-text">Configuration Management</p>
            <p className="mt-0.5 text-xs text-dt-text-muted">
              Platform settings are managed via environment variables for security. Smart contract parameters
              are configured during deployment and enforced on-chain. See the project documentation for
              configuration guides.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
