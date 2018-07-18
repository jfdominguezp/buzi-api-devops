const bcrypt          = require('bcrypt');
const LocalUser       = require('../../models/local-user');
const VerifyToken     = require('../../models/verify-token');
const mailing         = require('../../middleware/mailing');

async function signup({ email, password, username }, schemaInstance, connection, returnFields, usernameRequired) {
    //Admin, Member or Business
    const credentials = { email, password, username };
    const localUser = await insertLocalUser(credentials, connection, usernameRequired);
    const newIdentity = { userId: localUser._id, provider: 'Local', isSocial: false };
    schemaInstance.identities.push(newIdentity);
    const savedInstance = await schemaInstance.save();
    const responseData = { };
    returnFields.forEach(field => { responseData[field] = savedInstance[field] });
    startEmailVerification(localUser._id, 'Local', false, schemaInstance.name, localUser.email);
    return { userId: localUser._id, data: responseData };
}

async function insertLocalUser({ email, password, username }, connection){
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = new LocalUser({ email, passwordHash, connection, username });
    return newUser.save();
}

async function startEmailVerification(userId, provider, isSocial, name, email) {
    const token = await VerifyToken.generateToken(userId, provider, isSocial);
    if(token) {
        const query = `id=${userId}&token=${token.token}&p=${provider}&social=${isSocial}`;
        mailing.sendVerificationEmail(name, email, query);
    }
}

module.exports = signup;