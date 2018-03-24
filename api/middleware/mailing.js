var sendgrid   = require('@sendgrid/mail');
var dateFormat = require('dateformat');

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
console.log('Sendgrid API KEY: ' + process.env.SENDGRID_API_KEY);
sendgrid.setSubstitutionWrappers('{{', '}}');

//TODO Configuration variables in config file

var mailing = {
    sendCoupon: sendCoupon,
    sendGenericMessage: genericMessage,
    sendVerificationEmail: sendVerificationEmail,
    sendPasswordReset: sendPasswordReset
}

function sendCoupon(coupon, code, user) {
    var message = {
        from: {
            name: 'Buzi',
            email: 'cupones@buziapp.com',
        },
        to: user.email,
        subject: coupon.owner.name,
        text: coupon.description,
        html: "<h1>" + coupon.name + "</h1>",
        templateId: '781ba84d-4695-47b1-b514-49fb4f5d2eb8',
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
        .then(function(data) {
            //Successfully sent
        })
        .catch(function(error) {
            console.log(error);
        });
}

function sendVerificationEmail(name, email, query) {
    var message = {
        from: {
            name: 'Buzi',
            email: 'noreply@buziapp.com'
        },
        to: email,
        templateId: 'a98d411b-af61-425c-9ff3-41cdbe000e24',
        substitutions: {
            'name': name,
            'query': query
        }
    };

    sendgrid.send(message)
        .catch(function(error) {
            console.log(error);
        });
}

function sendPasswordReset(email, query) {
    var message = {
        from: {
            name: 'Buzi',
            email: 'noreply@buziapp.com'
        },
        to: email,
        templateId: '2e84ede3-2c5d-4128-8b5d-31ad0cca1547',
        substitutions: {
            'query': query
        }
    };

    sendgrid.send(message)
        .catch(function(error) {
            console.log(error);
        });
}

function genericMessage(name, email, subject, message, to) {
    var message = {
        from: {
            name: name,
            email: email
        },
        to: to,
        subject: subject,
        text: message
    };

    return sendgrid.send(message);
}

module.exports = mailing;
