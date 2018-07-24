const express         = require('express');
const branches        = require('./branches.routes');
const spendingRewards = require('./spending-rewards.routes');
const router          = express.Router();

router.use('/branches', branches);
router.use('/spendingrewards', spendingRewards);

module.exports = router;