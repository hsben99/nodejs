const express = require('express');
const app = express();
const morgan = require('morgan');
const winston = require('winston');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');


app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));


const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
      new winston.transports.File({ filename: 'combined.log' })
    ]
  });

const htmlPath = process.cwd()+'/html';

app.get('/', (req, res) => {
  logger.info('루트 URL에 접속했습니다.');
  res.sendFile(htmlPath+'/hello.html');
});

app.post('/send-mail', (req, res) => {
    // 폼 데이터 추출
    const { name, email} = req.body;

    const message=`안녕하세요 오랜만입니다 ${name} 님! 이건 auto responder입니다!.`
  
    // 이메일 전송 설정
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'hsben99@gmail.com', // 보내는 이메일 계정
        pass: 'muwjwchwznwagfmj' // 보내는 이메일 계정 비밀번호
      },
      secure: true,
    });
  
    // 이메일 내용 설정
    const mailOptions = {
      from: 'hsben99@gmail.com', // 보내는 이메일 주소
      to: email, // 받는 이메일 주소
      subject: `node.js 님으로부터 메시지가 도착했습니다.`, // 이메일 제목
      text: message // 이메일 내용
    };
  
    // 이메일 전송
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(error);
        res.status(500).send('메일 전송에 실패했습니다.');
        logger.info(`name : ${name}, eamil : ${email} ... mail send fail`);
      } else {
        logger.info(`name : ${name}, eamil : ${email} ... mail send success`);
        console.log('메일이 성공적으로 전송되었습니다.');
        res.send('메일이 성공적으로 전송되었습니다.');
        
      }
    });
  });
  
/*
app.post('/submit', (req, res) => {
    logger.info('submit 요청');
    const name = req.body.name;
    const email = req.body.email;
    console.log(`Name: ${name}, Email: ${email}`);
    res.send(`Name: ${name}, Email: ${email}`);
});
*/


const port = 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
