var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const initSkybolt = require('skybolt');

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Prettyprint HTML
app.locals.pretty = app.get('env') === 'development';

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Skybolt (caching, routing, and render override) before routes
initSkybolt(express, app, {
  sessionConfig: {
    secret: 'definitely not keyboard cat'
  },
  assetPaths: {
    scripts: path.join(__dirname, 'public', 'javascripts'),
    styles: path.join(__dirname, 'public', 'stylesheets'),
    fragments: path.join(__dirname, 'public', 'fragments') 
  }
});

app.use('/', indexRouter);

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

module.exports = app;
