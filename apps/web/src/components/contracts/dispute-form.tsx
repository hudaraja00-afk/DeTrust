'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, Paperclip, Upload, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { uploadApi } from '@/lib/api/upload';

const DISPUTE_REASONS = [
  'Quality issues',
  'Missed deadline',
  'Non-payment',
  'Scope disagreement',
  'Communication breakdown',
  'Other',
];

const MAX_FILES = 5;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

interface DisputeFormProps {
  onSubmit: (reason: string, evidence: string[]) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

export function DisputeForm({ onSubmit, onCancel, loading }: DisputeFormProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const remaining = MAX_FILES - files.length;

    if (selected.length > remaining) {
      toast.error(`You can attach up to ${MAX_FILES} files total`);
    }

    const toAdd = selected.slice(0, remaining).filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`"${f.name}" exceeds the 25 MB limit`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...toAdd]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason');
      return;
    }
    if (description.length < 50) {
      toast.error('Description must be at least 50 characters');
      return;
    }

    let evidenceUrls: string[] = [];
    if (files.length > 0) {
      setUploading(true);
      try {
        const results = await Promise.all(
          files.map((file) => uploadApi.uploadDeliverable(file))
        );
        evidenceUrls = results
          .filter((r) => r.success && r.data?.url)
          .map((r) => r.data!.url);

        if (evidenceUrls.length < files.length) {
          toast.error('Some files failed to upload');
        }
      } catch {
        toast.error('Failed to upload evidence files');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    await onSubmit(`${reason}: ${description}`, evidenceUrls);
  };

  const isBusy = loading || uploading;

  return (
    <Card className="border-red-200 bg-red-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-red-700">
          <AlertTriangle className="h-5 w-5" /> Raise a Dispute
        </CardTitle>
        <p className="text-sm text-dt-text-muted">
          Disputes are reviewed by our resolution team. Provide as much detail as possible.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-dt-text-muted">Reason *</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-dt-border px-3 py-2 text-sm"
          >
            <option value="">Select a reason</option>
            {DISPUTE_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-dt-text-muted">Description * (min 50 chars)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail..."
            rows={4}
            className="border-dt-border"
          />
          <p className="mt-1 text-xs text-dt-text-muted">{description.length}/50 characters minimum</p>
        </div>

        {/* Evidence File Upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-dt-text-muted">
            Evidence (optional, up to {MAX_FILES} files, 25 MB each)
          </label>

          {files.length > 0 && (
            <div className="mb-2 space-y-1">
              {files.map((file, idx) => (
                <div
                  key={`${file.name}-${idx}`}
                  className="flex items-center justify-between rounded-lg border border-dt-border bg-white px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 truncate text-dt-text">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-dt-text-muted" />
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-dt-text-muted">
                      ({(file.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="ml-2 shrink-0 rounded p-0.5 text-dt-text-muted hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {files.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-dt-border p-3 text-sm text-dt-text-muted transition hover:border-red-300 hover:text-red-600"
            >
              <Upload className="h-4 w-4" />
              Attach evidence files
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx,.txt,.zip"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isBusy} className="border-dt-border">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isBusy || !reason || description.length < 50}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isBusy ? <Spinner size="sm" /> : 'Submit Dispute'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
