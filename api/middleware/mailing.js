var sendgrid = require('@sendgrid/mail');
var dateFormat = require('dateformat');

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
console.log('Sendgrid API KEY: ' + process.env.SENDGRID_API_KEY);
sendgrid.setSubstitutionWrappers('{{', '}}');

var mailing = {
  sendCoupon: sendCoupon,
  sendGenericMessage: genericMessage
}

function sendCoupon(coupon, code, userEmail) {
  var message = {
    from: {
      name: 'Mr. Cupón',
      email: 'cupones@mistercupon.co',
    },
    to: userEmail,
    subject: '¡Felicitaciones! Aquí está tu cupón para ' + coupon.owner.name,
    text: coupon.description,
    html: "<h1>" + coupon.name + "</h1>",
    templateId: '781ba84d-4695-47b1-b514-49fb4f5d2eb8',
    substitutions: {
      'coupon_name': coupon.name,
      'coupon_code': code,
      'coupon_enddate': dateFormat(coupon.finalDate, 'dd/mm/yyyy'),
      'business_name': coupon.owner.name,
      'business_address': coupon.owner.basicData.address,
      'business_phone': coupon.owner.basicData.phoneNumber
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
