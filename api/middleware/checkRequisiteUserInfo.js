const { query } = require('../../db');

async function checkRequisiteUserInfo(req, res, next) {
  const user = await query('SELECT * FROM users WHERE id = $1;', [
    req.session.passport.user,
  ]);
  if (!user.rows[0]) {
    res.redirect('/auth/logout');
  }
  const { username, phone_number, email } = user.rows[0];
  const requiredInfo = { username, phone_number, email };
  for (let key in requiredInfo) {
    if (requiredInfo[key]) delete requiredInfo[key];
  }
  if (!username || !phone_number || !email)
    res.status(400).json({ missing_information: Object.keys(requiredInfo) });
  else next();
}

module.exports = checkRequisiteUserInfo;
