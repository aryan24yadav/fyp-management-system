/**
 * Saves a Blob as a file in the browser.
 * The old inline versions called link.remove() and then
 * link.parentNode.removeChild(link) (parentNode is null after remove()), which
 * threw and skipped revokeObjectURL, leaking the blob URL.
 */
export const saveBlob = (blob, fileName = "download") => {
  if (!(blob instanceof Blob)) return;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};

/**
 * Dispatches a download thunk and saves the result. Does nothing when the
 * thunk was rejected (the thunk already shows an error toast).
 */
export const downloadWithThunk = async (dispatch, thunk, args, fileName) => {
  const result = await dispatch(thunk(args));
  if (thunk.fulfilled.match(result)) {
    saveBlob(result.payload.blob, fileName);
  }
};

/** Human readable size, e.g. 1.4 MB. */
export const formatFileSize = (bytes) => {
  if (!bytes || Number.isNaN(Number(bytes))) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let size = Number(bytes);
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};
