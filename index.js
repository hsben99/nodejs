const express = require('express');
const app = express();
const morgan = require('morgan');
const winston = require('winston');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const multer = require('multer');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

var urlencodedParser = bodyParser.urlencoded({ extended: false }); 

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

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'blog'
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database: ' + err.stack);
    return;
  }

  console.log('Connected to database with ID ' + connection.threadId);
});

const htmlPath = process.cwd()+'/public/';

app.get('/', (req, res) => {
  logger.info('루트 URL에 접속했습니다.');
  res.sendFile(htmlPath+'/index.html');
});

/* 메일
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


  // 데이터 삽입 쿼리 실행
  connection.query(
    'INSERT INTO member (name, email) VALUES (?, ?)', [name, email],(error, results, fields) => {
      if (error) throw error;
      console.log(`Inserted ${results.affectedRows} rows`);
    }
  );

  // 연결 종료
  connection.end();
});

*/


app.get('/getContentData', function(req, res) {
  connection.query(
    `SELECT 
      seq
    , contentTitle
    , contentDesc
    , DATE_FORMAT(createDate, '%Y-%m-%d') as createDate 
    FROM content 
    WHERE seq = ?`
    ,[req.query.seq]
    ,(error, results, fields) => {
      if (error) {
        console.error('쿼리 실행 에러:', error);
        res.status(500).send('서버 에러');
        return;
      }

       if (results.length > 0) {
        const row = results[0];
        // 조회된 Row 사용
        console.log('조회된 Row:', row);
        res.json(row);
      } else {
        console.log('조회된 Row 없음');
        res.status(404).send('데이터 없음');
      }

    }
  );
});


app.get('/getContents', function(req, res) {
  connection.query(
    `SELECT 
     seq
    ,contentTitle
    , contentDesc
    , DATE_FORMAT(createDate, '%Y-%m-%d') as createDate
     FROM content
     WHERE deleteYn ='N'
     ORDER BY seq desc`
    ,(error, results, fields) => {
      if (error) {
        console.error('쿼리 실행 에러:', error);
        res.status(500).send('서버 에러');
        return;
      }

       if (results.length > 0) {
        
        console.log('조회된 Row:', results);
        res.json(results);
      } else {
        console.log('조회된 Row 없음');
        res.status(404).send('데이터 없음');
      }

    }
  );
});


// 파일 업로드를 위한 multer 설정
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/');  // 업로드된 파일이 저장될 경로
  },
  filename: function (req, file, cb) {

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

    cb(null, uniqueSuffix + file.originalname);  // 업로드된 파일의 이름 설정
  }
});
const upload = multer({ storage });

app.post('/uploadImage',upload.single('file'), (req, res) => { 
  const uplaodPath = `/images/${req.file.filename}`
  res.json({ "uplaodPath": uplaodPath});
});

app.post('/writeContent', (req, res) => {
  const title = req.body.contentTitle;
  const content = req.body.contentDesc;
  
  connection.query(
    `INSERT INTO content (contentTitle, contentDesc) VALUES (?, ?)`
    , [title, content]
    , (error, results, fields) => {
      if (error) throw error;
      console.log(`Inserted ${results.affectedRows} rows`);
    }
  );
  res.sendFile(htmlPath+'/index.html');
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
