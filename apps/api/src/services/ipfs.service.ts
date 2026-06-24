import crypto from 'crypto';
import FormData from 'form-data';

import { config } from '../config';

/**
 * IPFS Service — uploads content (JSON + binary files) to IPFS via Pinata.
 * Falls back to Lighthouse if configured, or a local SHA-256 hash for dev.
 *
 * Used by reviewService (SRS FR-J7.7) and disputeService (evidence uploads).
 */

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface LighthouseUploadResponse {
  Name: string;
  Hash: string;
  Size: string;
}

export interface IpfsUploadResult {
  cid: string;
  gatewayUrl: string;
  fileName: string;
  size: number;
}

export class IpfsService {
  private readonly apiKey: string | undefined;
  private readonly secretKey: string | undefined;
  private readonly gateway: string;
  private readonly lighthouseApiKey: string | undefined;
  private readonly lighthouseUploadUrl: string;
  private readonly lighthouseGateway: string;

  constructor() {
    this.apiKey = config.ipfs.pinataApiKey;
    this.secretKey = config.ipfs.pinataSecretKey;
    this.gateway = config.ipfs.gateway;
    this.lighthouseApiKey = config.storage.lighthouse.apiKey;
    this.lighthouseUploadUrl = config.storage.lighthouse.uploadUrl;
    this.lighthouseGateway = config.storage.lighthouse.gatewayUrl;
  }

  /**
   * Whether the Pinata IPFS integration is configured.
   */
  get isConfigured(): boolean {
    return !!(this.apiKey && this.secretKey);
  }

  /**
   * Whether Lighthouse storage is configured.
   */
  get isLighthouseConfigured(): boolean {
    return !!this.lighthouseApiKey;
  }

  /**
   * Upload JSON content to IPFS via Pinata.
   * Returns the IPFS CID (content hash).
   * Falls back to a local SHA-256 hash if Pinata is not configured.
   */
  async uploadJSON(data: Record<string, unknown>, name?: string): Promise<string> {
    if (!this.isConfigured) {
      // Fallback: compute deterministic SHA-256 hash of the content
      const json = JSON.stringify(data);
      return `sha256:${crypto.createHash('sha256').update(json).digest('hex')}`;
    }

    const body = JSON.stringify({
      pinataContent: data,
      pinataMetadata: { name: name ?? 'detrust-content' },
    });

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: this.apiKey!,
        pinata_secret_api_key: this.secretKey!,
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('[IpfsService] Pinata upload failed:', text);
      // Fallback to local hash on failure
      const json = JSON.stringify(data);
      return `sha256:${crypto.createHash('sha256').update(json).digest('hex')}`;
    }

    const result = (await response.json()) as PinataResponse;
    return result.IpfsHash;
  }

  /**
   * Upload a binary file to IPFS.
   * Tries Pinata first, then Lighthouse, then falls back to SHA-256 hash.
   *
   * @param buffer - File contents as a Buffer
   * @param fileName - Original file name (for metadata)
   * @param mimeType - MIME type of the file (e.g. 'application/pdf')
   * @returns Upload result with CID, gateway URL, file name, and size
   */
  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<IpfsUploadResult> {
    // Attempt Pinata first
    if (this.isConfigured) {
      try {
        return await this.uploadFileToPinata(buffer, fileName, mimeType);
      } catch (err) {
        console.error('[IpfsService] Pinata file upload failed, trying Lighthouse:', err);
      }
    }

    // Attempt Lighthouse second
    if (this.isLighthouseConfigured) {
      try {
        return await this.uploadFileToLighthouse(buffer, fileName, mimeType);
      } catch (err) {
        console.error('[IpfsService] Lighthouse file upload failed, using SHA-256 fallback:', err);
      }
    }

    // Dev fallback: return a deterministic SHA-256 hash
    const cid = `sha256:${crypto.createHash('sha256').update(buffer).digest('hex')}`;
    return { cid, gatewayUrl: '', fileName, size: buffer.length };
  }

  /**
   * Upload multiple files to IPFS, returning results for each.
   */
  async uploadFiles(
    files: Array<{ buffer: Buffer; fileName: string; mimeType: string }>,
  ): Promise<IpfsUploadResult[]> {
    return Promise.all(
      files.map((f) => this.uploadFile(f.buffer, f.fileName, f.mimeType)),
    );
  }

  /**
   * Get the gateway URL for an IPFS CID.
   */
  getGatewayUrl(cid: string): string {
    if (cid.startsWith('sha256:')) {
      return ''; // Local hash, no gateway URL
    }
    // Prefer Pinata gateway, fall back to Lighthouse gateway
    if (this.gateway) {
      return `${this.gateway}/${cid}`;
    }
    if (this.lighthouseGateway) {
      return `${this.lighthouseGateway}/${cid}`;
    }
    return `https://ipfs.io/ipfs/${cid}`;
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: Pinata file upload
  // ---------------------------------------------------------------------------
  private async uploadFileToPinata(
    buffer: Buffer,
    fileName: string,
    _mimeType: string,
  ): Promise<IpfsUploadResult> {
    const form = new FormData();
    form.append('file', buffer, { filename: fileName });
    form.append(
      'pinataMetadata',
      JSON.stringify({ name: fileName }),
    );

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        pinata_api_key: this.apiKey!,
        pinata_secret_api_key: this.secretKey!,
        ...(form.getHeaders?.() ?? {}),
      },
      body: form as any,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Pinata pinFileToIPFS failed (${response.status}): ${text}`);
    }

    const result = (await response.json()) as PinataResponse;
    const cid = result.IpfsHash;

    return {
      cid,
      gatewayUrl: this.getGatewayUrl(cid),
      fileName,
      size: buffer.length,
    };
  }

  // ---------------------------------------------------------------------------
  // PRIVATE: Lighthouse file upload
  // ---------------------------------------------------------------------------
  private async uploadFileToLighthouse(
    buffer: Buffer,
    fileName: string,
    _mimeType: string,
  ): Promise<IpfsUploadResult> {
    const form = new FormData();
    form.append('file', buffer, { filename: fileName });

    // Node's native fetch doesn't handle form-data objects correctly —
    // we must pass the buffer + headers manually.
    const formBuffer = form.getBuffer();
    const formHeaders = form.getHeaders();

    const response = await fetch(`${this.lighthouseUploadUrl}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.lighthouseApiKey}`,
        ...formHeaders,
      },
      body: formBuffer,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Lighthouse upload failed (${response.status}): ${text}`);
    }

    const result = (await response.json()) as { data: LighthouseUploadResponse };
    const cid = result.data.Hash;

    return {
      cid,
      gatewayUrl: `${this.lighthouseGateway}/${cid}`,
      fileName,
      size: buffer.length,
    };
  }
}

export const ipfsService = new IpfsService();
export default ipfsService;