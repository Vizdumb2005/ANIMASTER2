import { useState, useCallback, useEffect } from 'react';
import { getVideoExporter } from '../runtime/export/VideoExporter';
import type { ExportProgress, ExportQuality } from '../runtime/export/VideoExporter';

export default function ExportPanel() {
  const [isRecording, setIsRecording] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<ExportQuality>('standard');
  const [duration, setDuration] = useState(10);

  const exporter = getVideoExporter();

  const handleExport = useCallback(async () => {
    if (isRecording) return;
    setIsRecording(true);
    setError(null);

    try {
      const blob = await exporter.exportVideo(
        {
          format: 'webm',
          quality,
          fps: 30,
          durationSeconds: duration,
          width: 960,
          height: 540,
        },
        setProgress,
      );

      if (blob) {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
        const filename = `animaster-${timestamp}.${ext}`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setError('Export failed — no video data captured');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsRecording(false);
      setProgress(null);
    }
  }, [isRecording, quality, duration, exporter]);

  const handleCaptureFrame = useCallback(() => {
    const dataUrl = exporter.captureFrame();
    if (dataUrl) {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `animaster-frame-${Date.now()}.png`;
      a.click();
    }
  }, [exporter]);

  return (
    <div className="export-panel">
      <h3>Export</h3>

      <div className="export-controls">
        <label>
          Quality
          <select value={quality} onChange={e => setQuality(e.target.value as ExportQuality)}>
            <option value="draft">Draft (2 Mbps)</option>
            <option value="standard">Standard (5 Mbps)</option>
            <option value="high">High (12 Mbps)</option>
          </select>
        </label>

        <label>
          Duration
          <input
            type="number"
            min={1}
            max={120}
            value={duration}
            onChange={e => setDuration(Math.max(1, Math.min(120, parseInt(e.target.value) || 10)))}
          />
          <span>seconds</span>
        </label>
      </div>

      <div className="export-actions">
        <button
          className="export-btn"
          onClick={handleExport}
          disabled={isRecording}
        >
          {isRecording ? '⏺ Recording...' : '⏺ Export Video'}
        </button>

        <button
          className="frame-btn"
          onClick={handleCaptureFrame}
          disabled={isRecording}
        >
          📷 Capture Frame
        </button>
      </div>

      {progress && (
        <div className="export-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
          <span className="progress-label">
            {progress.phase === 'capturing' && `Capturing: ${progress.framesCaptured}/${progress.totalFrames} frames`}
            {progress.phase === 'encoding' && 'Encoding...'}
            {progress.phase === 'done' && 'Export complete!'}
            {progress.phase === 'error' && `Error: ${progress.error}`}
          </span>
        </div>
      )}

      {error && <div className="export-error">{error}</div>}
    </div>
  );
}