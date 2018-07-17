const sendgrid   = require('@sendgrid/mail');
const dateFormat = require('dateformat');
const config     = require('../../config/server-config');
const templates  = require('../../config/mailing-templates.json');

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
sendgrid.setSubstitutionWrappers('{{', '}}');

//TODO Configuration constiables in config file

const mailing = {
    sendCoupon,
    sendVerificationEmail,
    sendPasswordReset
}

function sendCoupon(coupon, code, user) {
    const message = {
        ...templates.coupon,
        to: user.email,
        subject: coupon.owner.name,
        text: coupon.description,
        html: "<h1>" + coupon.name + "</h1>",
        substitutions: {
            'memberName': user.name,
            'couponName': coupon.name,
            'couponCode': code,
            'couponFinalDate': dateFormat(coupon.finalDate, 'dd/mm/yyyy'),
            'businessName': coupon.owner.name,
            'businessAddress': coupon.owner.basicData.address,
            'businessPhone': coupon.owner.basicData.phoneNumber
        }
    };
    sendgrid.send(message)
        .catch(function(error) {
            //TODO Report to Raven
        });
}

function sendVerificationEmail(name, email, query) {
    const message = {
        ...templates.emailVerification,
        to: email,
        substitutions: {
            'name': name,
            'query': query
        }
    };

    sendgrid.send(message)
        .catch(function(error) {
            //TODO Report to Raven
        });
}

function sendPasswordReset(email, query, connection) {
    const url = {
        People: `${config.URIs.baseUri}/${config.URIs.passwordResetPath}?`,
        Businesses: `${config.URIs.businessUri}/${config.URIs.passwordResetPath}?`,
    };
    const message = {
        ...templates.passwordReset,
        to: email,
        substitutions: {
            'query': url[connection] + query
        }
    };
    sendgrid.send(message)
        .catch(function(error) {
            //TODO Report to Raven
        });
}

module.exports = mailing;
