const Koa = require('koa');
const koaBody = require('koa-body');

// 引入jwt认证模块
const jwtKoa = require('koa-jwt');

// 配置项
const config = require('./config');
// 创建一个Koa对象表示web app本身
const app = new Koa();

// 连接数据库
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
mongoose.set('useCreateIndex', true);
mongoose.connect(`mongodb://${config.database.USER}:${config.database.PASSWORD}@${config.database.URL}`,{ useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connection.on('connected', () => {
    console.log('Mongoose connection open to ' + `${config.database.URL}`);
});
mongoose.connection.on('error', (err) => {
    console.log('Mongoose connection error: ' + err);
});
mongoose.connection.on('disconnected', () => {
    console.log('Mongoose connection disconnected');
});

// 显示日志
const logger = require('koa-logger');
app.use(logger());

// 显示错误信息
const onerror = require('koa-onerror');
onerror(app);

// 允许跨域
app.use(async(ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    ctx.set('Access-Control-Allow-Headers', 'Authorization, Origin, X-Requested-With, Content-Type, Accept');
    await next();
});

// 错误处理
app.use(require('./app/middlewares/error'));
app.on('error', function(err, ctx) {
    // 忽略OPTIONS请求错误
    if (ctx.request.method === 'OPTIONS') return;
    console.log('logging error: ', err);
});

// 使用jwtKoa
app.use(jwtKoa({
    secret: config.secret
}).unless({
    path: [/^\/api\/user\/login/, /^\/api\/user\/register/]
}))

// body报表解析
app.use(koaBody({
    multipart: true
}));

// 添加接口表
app.use(require('./app/routers/user').routes())

// socket连接
const server = require('http').Server(app.callback());
const io = require('socket.io')(server, {
    path: '/api/ws'
});

io.on('connection', (socket) => {
    socket.handshake.query.userId;
});

// 在端口config.port监听
server.listen(config.port);

// 在端口config.port监听 
// app.listen(config.port);