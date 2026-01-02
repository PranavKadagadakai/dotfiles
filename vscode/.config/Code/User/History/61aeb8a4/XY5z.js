module.exports = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    statusCode: err.statusCode || 500,
    error: err.message || "Server Error",
  });
};
