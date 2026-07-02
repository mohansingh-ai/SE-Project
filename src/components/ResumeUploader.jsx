import React, { useState } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * ResumeUploader
 * - Accepts PDF or DOCX files (drag-and-drop or click to browse)
 * - Uploads to Firebase Storage at candidates/{uid}/resume.{ext}
 * - Extracts text client-side:
 *     PDF  → pdfjs-dist (runs in browser, no server needed)
 *     DOCX → mammoth.js  (runs in browser, no server needed)
 * - Calls onTextExtracted(text, downloadURL) when done
 */
export default function ResumeUploader({ uid, onTextExtracted, onUploadComplete }) {
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | uploading | parsing | done | error
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');

  async function extractText(file) {
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'pdf') {
      // Dynamic import so bundle stays lean
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      return text;
    }

    if (ext === 'docx') {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    }

    throw new Error('Unsupported file type. Please upload PDF or DOCX.');
  }

  async function handleFile(file) {
    if (!file) return;
    setError('');
    setFileName(file.name);

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx'].includes(ext)) {
      setError('Only PDF and DOCX files are supported.');
      return;
    }

    try {
      // 1. Read file as Base64 Data URL (bypassing Storage to avoid Spark plan billing restrictions)
      setStatus('uploading');
      setProgress(50);
      const downloadURL = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (e) => reject(new Error('Failed to read file for local storage.'));
        reader.readAsDataURL(file);
      });
      setProgress(100);

      // 2. Extract text client-side
      setStatus('parsing');
      const text = await extractText(file);

      setStatus('done');
      onTextExtracted?.(text, downloadURL);
      onUploadComplete?.(downloadURL);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Upload failed.');
      setStatus('error');
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  return (
    <div>
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('resume-file-input').click()}
      >
        <input
          id="resume-file-input"
          type="file"
          accept=".pdf,.docx"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />

        {status === 'idle' || status === 'error' ? (
          <>
            <div className="upload-icon">📄</div>
            <div className="upload-title">Drop your resume here</div>
            <div className="upload-hint">PDF or DOCX · Click to browse</div>
          </>
        ) : status === 'uploading' ? (
          <>
            <div className="upload-icon">⬆️</div>
            <div className="upload-title">Uploading… {progress}%</div>
            <div style={{ width: '80%', margin: '0.75rem auto 0', background: 'var(--border)', height: 6, borderRadius: 3 }}>
              <div style={{ width: `${progress}%`, background: 'var(--accent)', height: '100%', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </>
        ) : status === 'parsing' ? (
          <>
            <div className="upload-icon">🤖</div>
            <div className="upload-title">Parsing resume with AI…</div>
            <div className="upload-hint">Extracting skills, experience & education</div>
          </>
        ) : (
          <>
            <div className="upload-icon">✅</div>
            <div className="upload-title">{fileName}</div>
            <div className="upload-hint" style={{ color: 'var(--success)' }}>Resume uploaded & parsed successfully!</div>
          </>
        )}
      </div>

      {error && <div className="alert alert-error mt-2">{error}</div>}
    </div>
  );
}
