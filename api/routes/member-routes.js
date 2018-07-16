var express = require('express');
var auth    = require('../auth/auth');
var router  = express.Router();

router.get('/', auth.authenticateMember(), getMember);

function getMember(request, response) {
    response.json(request.user);
}

module.exports = router;
