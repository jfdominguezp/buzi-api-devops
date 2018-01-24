var express = require('express');
var auth    = require('../auth/auth');
var router  = express.Router();

router.get('/:id', auth.authenticateMember(), getMember);

function getMember(request, response) {
    response.json('Authenticated');
}

module.exports = router;
