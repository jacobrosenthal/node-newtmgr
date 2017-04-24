var from2 = require('from2');
var to2 = require('flush-write-stream');
var nmgr = require('../../../nmgr');
var utility = require('../../../utility');
var protocol = require('../protocol');
var debug = require('debug')('newtmgr-serial-log');


var show = function(emitter, name, done){
  if (typeof(name) === 'function') {
    done = name;
    name = "";
  }

  var cmd = { index: 0, log_name: name, ts: 0 };
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  from2.obj([nmgr.generateLogShowBuffer(cmd)])
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

var clear = function(emitter, done){
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  from2.obj([nmgr.generateLogClearBuffer()])
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

var levelList = function(emitter, done){
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  from2.obj([nmgr.generateLogLevelListBuffer()])
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

var moduleList = function(emitter, done){
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  from2.obj([nmgr.generateLogModuleListBuffer()])
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

var list = function(emitter, done){
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  from2.obj([nmgr.generateLogListBuffer()])
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
  show: show,
  clear: clear,
  levelList: levelList,
  moduleList: moduleList,
  list: list
};
