var ManagementClient = require('auth0').ManagementClient;

var auth0 = new ManagementClient({
  domain: 'mrcupon.auth0.com',
  clientId: 's1W0vQhTsQboLsVa5Wqq0rxDdjajXkXo',
  clientSecret: '8HZ0-ugRzRkrgYhSjWbmTbD-_0NHplgRxcF5Jn_wLH5kzQv_lklxp0pA31eDMTNM'
});

var auth = {
  getPerson: getPerson,
  getBusiness: getBusiness
};

function getPerson(userId) {
  return auth0.getUsers({ q: 'identities.connection: "People" AND user_id:' + '"' + userId + '"' });
}


function getBusiness(userId) {

}

module.exports = auth;
