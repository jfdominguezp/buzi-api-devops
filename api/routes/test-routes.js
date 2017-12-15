var express = require('express');
var router = express.Router();

router.get('/', getTest);
router.get('/error', getTestError);

function getTest(request, response) {
  response.status(200).json('API is working');
}

function getTestError(request, response) {
  throw new Error('Broke!');
}

module.exports = router;
