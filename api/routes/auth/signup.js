const bcrypt                     = require('bcrypt');
const LocalUser                  = require('../../models/local-user');
const { startEmailVerification } = require('./verify-email');

async function signup({ email, password, username, phone, countryCode }, schemaInstance, connection, returnFields, usernameRequired) {
    //Admin, Member or Business
    const credentials = { email, password, username, phone, countryCode };
    const localUser = await insertLocalUser(credentials, connection, usernameRequired);
    const newIdentity = { userId: localUser._id, provider: 'Local', isSocial: false };
    schemaInstance.identities.push(newIdentity);
    const savedInstance = await schemaInstance.save();
    const responseData = { };
    returnFields.forEach(field => { responseData[field] = savedInstance[field] });
    startEmailVerification(localUser._id, 'Local', false, schemaInstance.name, localUser.email);
    return { userId: localUser._id, data: responseData };
}

async function insertLocalUser({ email, password, username, phone, countryCode }, connection){
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new LocalUser({ email, passwordHash, connection, username, phone, countryCode });
    return newUser.save();
}

module.exports = signup;