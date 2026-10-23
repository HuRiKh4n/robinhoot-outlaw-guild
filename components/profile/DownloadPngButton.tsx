'use client';

import { useEffect, useState } from 'react';

/** Prepared blob + synchronous click keeps the download inside the user's gesture. */
export default function DownloadPngButton({ url, filename, label, failed = false }: {
  url?: string; filename: string; label: string; failed?: boolean;
}) {
  const [status, setStatus] = useState('');
  useEffect(() => setStatus(''), [url]);
  function download() {
    if (!url) return;
    const anchor = document.createElement('a');
    anchor.href = url; anchor.download = filename;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setStatus('Download requested. Check Chrome’s Downloads list for the PNG file.');
  }
  return <div className="download-actions">
    <button type="button" className="button prominent-download" disabled={!url} onClick={download}>{label}</button>
    <p className="note" role="status">{status || (failed ? 'PNG creation is unavailable in this browser. Your draft is still editable.' : !url ? 'Preparing PNG…' : 'PNG image · ready to download')}</p>
    {url && <a className="download-fallback" href={url} target="_blank" rel="noopener noreferrer">OPEN PNG IF DOWNLOAD DOES NOT START ↗</a>}
  </div>;
}
