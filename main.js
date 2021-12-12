const express = require('express')
const app = express()
const port = 3000

const fs = require('fs');
const path = require('path');
const qs = require('querystring');
const bodyParser = require('body-parser');
const compression = require('compression')
const sanitizeHtml = require('sanitize-html');
const template = require('./lib/template.js');

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



// ======================================= 본문 =======================================
// express에서 제공하는 라우트 기능으로 모든 요청을 분리 가능
app.get('/', (req, res) => {
  console.log(req.list);
  var title = 'Welcome';
  var description = 'Hello, Node.js';
  var list = template.list(req.list);
  var html = template.HTML(title, list,
    `<h2>${title}</h2>${description}`,
    `<a href="/create">create</a>`
  );
  res.send(html);
})

// path방식으로 입력값 받기
app.get('/page/:pageId', (req, res) => {
  var filteredId = path.parse(req.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
    var title = req.params.pageId;
    var sanitizedTitle = sanitizeHtml(title);
    var sanitizedDescription = sanitizeHtml(description, {
      allowedTags: ['h1']
    });
    var list = template.list(req.list);
    var html = template.HTML(sanitizedTitle, list,
      `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
      ` <a href="/create">create</a>
          <a href="/update/${sanitizedTitle}">update</a>
          <form action="/delete" method="post">
            <input type="hidden" name="id" value="${sanitizedTitle}">
            <input type="submit" value="delete">
          </form>`
    );
    res.send(html);
  });
})


app.get('/create', (req, res) => {
  var title = 'WEB - create';
  var list = template.list(req.list);
  var html = template.HTML(title, list, `
      <form action="/create" method="post">
        <p><input type="text" name="title" placeholder="title"></p>
        <p>
          <textarea name="description" placeholder="description"></textarea>
        </p>
        <p>
          <input type="submit">
        </p>
      </form>
    `, '');
  res.send(html);
})

app.post('/create', (req, res) => {
  var post = req.body;
  var title = post.title;
  var description = post.description;
  fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
    res.redirect(`/page/${title}`)
  })
})

app.get('/update/:pageId', (req, res) => {
  var filteredId = path.parse(req.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
    var title = req.params.pageId;
    var list = template.list(req.list);
    var html = template.HTML(title, list,
      `
        <form action="/update" method="post">
          <input type="hidden" name="id" value="${title}">
          <p><input type="text" name="title" placeholder="title" value="${title}"></p>
          <p>
            <textarea name="description" placeholder="description">${description}</textarea>
          </p>
          <p>
            <input type="submit">
          </p>
        </form>
        `,
      `<a href="/create">create</a> <a href="/update/${title}">update</a>`
    );
    res.send(html);
  });
})

app.post('/update', (req, res) => {
  var post = req.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, function (error) {
    fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
      res.redirect(`/page/${title}`);
    })
  });
})

app.post('/delete', (req, res) => {
  var post = req.body;
  var id = post.id;
  var filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, function (error) {
    res.redirect('/');
  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})