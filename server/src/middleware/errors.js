// Browsers cancel media transfers when seeking, navigating, or refreshing.
// Only treat transport cancellation as expected once the connection is gone.
const disconnectCodes = new Set([
  "ECONNABORTED", "ECANCELED", "ECONNRESET", "EPIPE", "ERR_STREAM_PREMATURE_CLOSE",
]);
export function isClientDisconnect(error, req, res) {
  return Boolean(
    (req.aborted || req.socket?.destroyed || res.destroyed) &&
    (disconnectCodes.has(error.code) || error.type === "request.aborted"),
  );
}
export function localErrorHandler(error, req, res, next) {
  if (isClientDisconnect(error, req, res)) return;
  let status = error.status || 500;
  let message = error.message;
  if (error.code === "LIMIT_FILE_SIZE") {
    status = 413;
    message = "File exceeds the 15 MB limit.";
  } else if (error.name === "MulterError") {
    status = 422;
    message = "Upload one supported file at a time.";
  }
  if (status >= 500) {
    message = "The local data could not be accessed. Check the terminal and your data folder.";
    console.error(error.message);
  }
  // A streaming response cannot be replaced with JSON after headers were sent.
  if (res.headersSent) return next(error);
  if (res.destroyed || res.writableEnded) return;
  res.status(status).json({ error: { message, fields: error.fields || [] } });
}
