const isProd = process.env.NODE_ENV === 'production';

function format(level, msg, meta) {
  if (isProd) {
    const out = { level, message: msg, ts: new Date().toISOString() };
    if (meta) out.meta = meta;
    console.log(JSON.stringify(out));
  } else {
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
    if (level === 'error') console.error(`[ERROR] ${msg}${metaStr}`);
    else if (level === 'warn') console.warn(`[WARN] ${msg}${metaStr}`);
    else console.log(`[INFO] ${msg}${metaStr}`);
  }
}

module.exports = {
  info: (msg, meta) => format('info', msg, meta),
  warn: (msg, meta) => format('warn', msg, meta),
  error: (msg, meta) => format('error', msg, meta),
  debug: (msg, meta) => format('debug', msg, meta),
};
