var from2 = require('from2');
var to2 = require('flush-write-stream');
var through2 = require('through2');
var nmgr = require('../../nmgr');
var log = require('./log');
var image = require('./image');
var protocol = require('./protocol');
var utility = require('../../utility');
var debug = require('debug')('newtmgr-serial');


var stat = function(emitter, name, done){
  if (typeof(name) === 'function') {
    done = name;
    name = undefined;
  }

  var cmdList;
  if(name){
    var cmd = {name: name};
    cmdList = [nmgr.generateStatReadBuffer(cmd)];
  }else{
    cmdList = [nmgr.generateStatListBuffer()];
  }

  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  from2.obj(cmdList)
    .pipe(protocol.encode())
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(protocol.decode())
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      done(data.rc !==0 ? data.rc : null , data);
      })
    );
};

var reset = function(emitter, done){
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  from2.obj([nmgr.generateResetBuffer()])
    .pipe(protocol.encode())
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(protocol.decode())
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      done(data.rc !==0 ? data.rc : null , data);
      })
    );
};

var echo = function(emitter, status, done){
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  var cmd = {};
  cmd.echo = status;
  from2.obj([nmgr.generateEchoBuffer(cmd)])
    .pipe(protocol.encode())
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(protocol.decode())
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      done(data.rc !==0 ? data.rc : null , data);
      })
    );
};


module.exports = {
  reset: reset,
  echo: echo,
  stat: stat,
  log: log,
  image: image,
  protocol: protocol
};
