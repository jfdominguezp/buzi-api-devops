var sendgrid = require('@sendgrid/mail');
var dateFormat = require('dateformat');

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
sendgrid.setSubstitutionWrappers('{{', '}}');

var mailing = {
  sendCoupon: sendCoupon
}

function sendCoupon(coupon, code, userEmail) {
  console.log('Coupon: ');
  console.log(coupon);
  var message = {
    from: "cupones@mistercupon.co",
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
      'busines_address': coupon.owner.basicData.address,
      'business_phone': coupon.owner.basicData.phoneNumber
    }
  };
  sendgrid.send(message);
}

module.exports = mailing;
