const appendQueryParam = (targetUrl: string, key: string, value: string) => {
  try {
    const url = new URL(targetUrl);
    url.searchParams.set(key, value);
    return url.toString();
  } catch {
    return targetUrl;
  }
};

const decodeFilename = (headerValue?: string | null) => {
  if (!headerValue) {
    return undefined;
  }

  const filenameStarMatch = headerValue.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
  if (filenameStarMatch?.[1]) {
    try {
      return decodeURIComponent(filenameStarMatch[1].trim().replace(/^"|"$/g, ''));
    } catch {
      return filenameStarMatch[1].trim().replace(/^"|"$/g, '');
    }
  }

  const filenameMatch = headerValue.match(/filename="?([^";]+)"?/i);
  if (filenameMatch?.[1]) {
    return filenameMatch[1];
  }

  return undefined;
};

export interface SecureFileResponse {
  blob: Blob;
  mimeType: string;
  filename?: string;
  objectUrl?: string;
}

interface FetchSecureFileOptions {
  token?: string;
  download?: boolean;
  signal?: AbortSignal;
  attachObjectUrl?: boolean;
}

export async function fetchSecureFile(targetUrl: string, options: FetchSecureFileOptions): Promise<SecureFileResponse> {
  const { token, download, signal, attachObjectUrl } = options;

  const requestUrl = download ? appendQueryParam(targetUrl, 'download', '1') : targetUrl;
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers,
    credentials: 'include',
    signal,
  });

  if (!response.ok) {
    const fallbackMessage = `Secure file request failed (${response.status})`;
    let errorMessage = fallbackMessage;
    try {
      const errorJson = await response.json();
      errorMessage = errorJson?.error?.message || errorJson?.message || fallbackMessage;
    } catch {
      // Ignore body parsing errors, stick with fallback message
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const mimeType = response.headers.get('Content-Type') || 'application/octet-stream';
  const filename = decodeFilename(response.headers.get('Content-Disposition'));
  const objectUrl = attachObjectUrl ? URL.createObjectURL(blob) : undefined;

  return { blob, mimeType, filename, objectUrl };
}

export function releaseObjectUrl(url?: string) {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export async function openSecureFileInNewTab(targetUrl: string, options: FetchSecureFileOptions & { fallbackName?: string }) {
  const { attachObjectUrl = true, fallbackName } = options;
  const result = await fetchSecureFile(targetUrl, { ...options, attachObjectUrl });
  const { objectUrl, blob, filename } = result;
  const effectiveUrl = objectUrl ?? URL.createObjectURL(blob);

  if (options.download) {
    const link = document.createElement('a');
    link.href = effectiveUrl;
    link.download = filename || fallbackName || 'secure-file';
    link.rel = 'noopener noreferrer';
    link.click();
    setTimeout(() => releaseObjectUrl(effectiveUrl), 30_000);
    return;
  }

  const opened = window.open(effectiveUrl, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.location.href = effectiveUrl;
  }
  setTimeout(() => releaseObjectUrl(effectiveUrl), 30_000);
}
