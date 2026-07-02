/**
 * Utility to safely open a Base64 data URL or standard HTTP URL in a new browser tab.
 * Modern browsers block top-level navigation to data: URLs for security,
 * so we convert Base64 strings to Blobs and use URL.createObjectURL.
 */
export function openResume(url, fileName = 'resume') {
  if (!url) return;
  
  if (!url.startsWith('data:')) {
    // Standard Firebase Storage HTTP URL
    window.open(url, '_blank');
    return;
  }

  try {
    const parts = url.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const byteCharacters = atob(parts[1]);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: contentType });
    const blobUrl = URL.createObjectURL(blob);

    // Open Blob URL in new window/tab
    const newWindow = window.open(blobUrl, '_blank');
    if (newWindow) {
      newWindow.focus();
    } else {
      // Fallback: download if popups are blocked
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (err) {
    console.error('Failed to parse and open base64 URL:', err);
    // Ultimate fallback: open raw URL (might be blocked in some browsers)
    window.open(url, '_blank');
  }
}
