const { query } = require('../../db');

async function checkRequisiteUserInfo(req, res, next) {
  try {
    const user = await query('SELECT * FROM users WHERE id = $1;', [
      req.user.id,
    ]);
    if (!user.rows[0]) throw new Error();
    const { username, phoneNumber, email } = user.rows[0];
    const requiredInfo = Object.entries({
      username,
      phoneNumber,
      email,
    }).filter(attribute => !attribute[1]);
    if (requiredInfo.length)
      return res.status(400).json({
        missingInformation: requiredInfo.map(attribute => attribute[0]),
      });
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = checkRequisiteUserInfo;
