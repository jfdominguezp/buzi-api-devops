var ManagementClient = require('auth0').ManagementClient;

console.log('Auth0 Client Id: ' + process.env.AUTH0_CLIENT_ID);
console.log('Auth0 Client Secret: ' + process.env.AUTH0_CLIENT_SECRET);

var auth0 = new ManagementClient({
  domain: 'mrcupon.auth0.com',
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET
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
