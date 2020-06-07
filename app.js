const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const os = require('os');
const mysql = require('mysql');

const usersRouter = require('./routes/users');
const mainRouter = require('./routes/main');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/', mainRouter);
app.use('/users', usersRouter);
app.use('/main',mainRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
/////socket 설정 부분
//on -> 이벤트를 받기 위한 함수
//emit -> 이벤트를 보내기 위한 함수
//broadcast -> 단체로 보내기 위한 함수

app.io = require('socket.io')();

app.io.on('connect',function(socket){
  console.log('id: ' + socket.id);

  socket.on('message',function(message){
    console.log('Client ' + socket.id +  ' say: ',message);
    socket.broadcast.emit('message',message);
  });
  socket.on('signal',(toId,msg)=>{
    console.log('toID: '+ toId);
    console.log('Message: ' + msg);
    app.io.to(toId).emit('signal',socket.id,msg);
  });

  app.io.emit('join', socket.id, app.io.engine.clientsCount, Object.keys(app.io.sockets.clients().sockets));

  socket.on('disconnect', function() {
    console.log('left here');
    app.io.sockets.emit("user-left", socket.id);
  });

  socket.on('chatMessage',function(msg){
    console.log('ID : ' + socket.id +' : '+ msg );
    app.io.emit('Msg', {comment: socket.id + " : " + msg.comment});
  });

});

module.exports = app;

