const { DEFAULT_FLAGS, getChaosFlags, setChaosFlags } = require('../middleware/chaos');

exports.getStatus = async (_req, res) => {
  try {
    return res.json({ flags: await getChaosFlags() });
  } catch (error) {
    console.error('Chaos status error:', error);
    return res.status(500).json({ error: error.message || 'Unable to read chaos state' });
  }
};

exports.toggle = async (req, res) => {
  try {
    const updates = req.body?.flags || { [req.body?.flag]: req.body?.enabled };
    const unknownFlags = Object.keys(updates).filter(
      (flag) => !Object.prototype.hasOwnProperty.call(DEFAULT_FLAGS, flag)
    );
    if (unknownFlags.length > 0) {
      return res.status(400).json({ error: `Unknown chaos flag(s): ${unknownFlags.join(', ')}` });
    }
    if (Object.values(updates).some((enabled) => typeof enabled !== 'boolean')) {
      return res.status(400).json({ error: 'Each chaos flag value must be a boolean' });
    }

    return res.json({ flags: await setChaosFlags(updates) });
  } catch (error) {
    console.error('Chaos toggle error:', error);
    return res.status(500).json({ error: error.message || 'Unable to update chaos state' });
  }
};
