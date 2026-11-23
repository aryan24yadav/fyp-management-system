/**
 * Wraps an async Express handler so a rejected promise is forwarded to
 * next(err) and handled by errorMiddleware. Use it ONLY for (req, res, next)
 * route handlers, never for plain service functions.
 */
export const asyncHandler = (theFunction) => (req, res, next) => {
  Promise.resolve(theFunction(req, res, next)).catch(next);
};
