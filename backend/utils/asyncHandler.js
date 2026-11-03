// Tanglish: Async controller errors-ah Express error handler-kku forward pannum.

export default function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
