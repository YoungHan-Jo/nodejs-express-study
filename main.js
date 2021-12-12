const express = require('express')
const app = express()
const port = 3000

const fs = require('fs');
const bodyParser = require('body-parser');
const compression = require('compression')
const indexRouter = require('./routes/index');
const topicRouter = require('./routes/topic');

// 정적인 파일 관련 미들웨어. public폴더 아래의 정적파일을 url로 접근할 수 있게 됨.
app.use(express.static('public'));

// form형식으로 요청 받을 때 마다 미들웨어를 장착함
app.use(bodyParser.urlencoded({
  extended: false
}));
// json형식으로 요청 받았을 경우
app.use(bodyParser.json())

app.use(compression());

//미들웨어 만들기
app.get('*', function (req, res, next) {
  fs.readdir('./data', function (error, filelist) {
    req.list = filelist; // req객체에 list 속성을 추가하면 밑에서 사용할 수 있음
    next();
  });
});

// 미들웨어의 순서 if문도 사용가능
app.get('/user/:id', (req, res, next) => {
  if (req.params.id == 'aaa') next('route');
  else next();
}, (req, res, next) => {
  console.log('aaa가 아닙니다.')
})

app.get('/user/:id', (req, res, next) => {
  console.log('aaa입니다')
})

// ============================== 본문 =================================

// '/???'로 시작하는 주소들은 뒤에있는 ???Router 미들웨어를 적용
app.use('/', indexRouter);
app.use('/topic', topicRouter);


// 404 에러
app.use(function (req, res, next) {
  res.status(404).send('Sorry cant find that!');
});

// 에러 핸들링 미들웨어. next(err)에서 여기로 옴
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})