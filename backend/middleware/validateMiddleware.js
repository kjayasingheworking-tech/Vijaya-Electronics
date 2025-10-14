function get(obj, path) {
  return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
}
function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter((f) => {
      const v = get(req.body, f);
      return v === undefined || v === "";
    });
    if (missing.length) return res.status(400).json({ message: "Missing fields", missing });
    next();
  };
}
module.exports = { requireFields };
