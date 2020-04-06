const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'riccardo.prestigiacomo@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendGoodByeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'riccardo.prestigiacomo@gmail.com',
        subject: 'We are sorry that you go away! Fuck',
        text: 'What can we do to have you back on board?'
    })
}
module.exports = {
    sendWelcomeEmail,
    sendGoodByeEmail
}