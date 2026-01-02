export default (err, req, res, next) => {
  console.error(`❌ [${req.method}] ${req.url} - ${err.message}`);

  const status =
    res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    success: false,
    message: err.message || "Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
