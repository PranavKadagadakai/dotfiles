const log = (msg, type = "info") => {
  const color =
    type === "error"
      ? "\x1b[31m"
      : type === "success"
      ? "\x1b[32m"
      : "\x1b[36m";
  console.log(`${color}[${type.toUpperCase()}] ${msg}\x1b[0m`);
};

export default log;
