// super-light logger used by db + error middlewares
export const logger = {
  info:  (...a: any[]) => console.log("[INFO]",  ...a),
  warn:  (...a: any[]) => console.warn("[WARN]",  ...a),
  error: (...a: any[]) => console.error("[ERROR]", ...a),
  debug: (...a: any[]) => {
    if (process.env.NODE_ENV !== "production") console.debug("[DEBUG]", ...a);
  },
  child: (_: any) => logger, // keep API-compatible with pino-style .child()
};
export default logger;
