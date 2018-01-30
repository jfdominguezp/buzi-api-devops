var express = require('express');
var auth    = require('../auth/auth');
var router  = express.Router();

router.get('/:id', auth.authenticateMember(), getMember);

function getMember(request, response) {
    console.log('Inside Get Member');
    console.log(request.user);
    response.json(request.user);
}

module.exports = router;
