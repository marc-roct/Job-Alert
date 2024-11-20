import nodemailer from 'nodemailer';


export async function sendMail(jobs) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.APP_PASSWORD,
    },
  })
  
  let mailText = "";

  for (let job of jobs) {
    mailText += job.link + " " + job.title + " " + job.location + "\n";
  }
  

  let mailOptions = {
    from: 'marcthreza@gmail.com',
    to: 'marcthreza@gmail.com',
    subject: 'Job Alert',
    text: mailText,
  };

  // verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

  const sendMail = async () => {
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email has been sent!');
    } catch (error) {
      console.error(error)
    }
  }
  
  sendMail();
}

