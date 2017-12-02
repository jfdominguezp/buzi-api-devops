var express = require('express');
var router = express.Router();

router.get('/', getTest);

function getTest(request, response) {
  response.status(200).json('API is working');
}

module.exports = router;
