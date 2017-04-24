var from2 = require('from2');
var to2 = require('flush-write-stream');
var nmgr = require('../../../nmgr');
var utility = require('../../../utility');
var debug = require('debug')('newtmgr-ble-log');


var show = function(emitter, name, done){
  if (typeof(name) === 'function') {
    done = name;
    name = "";
  }

  var cmd = { index: 0, log_name: name, ts: 0 };
  var stream = emitter.stream({objectMode: true});
  from2.obj([nmgr.generateLogShowBuffer(cmd)])
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      done(data.rc !==0 ? data.rc : null , data);
      })
    );
};

var clear = function(emitter, done){
  var stream = emitter.stream({objectMode: true});
  from2.obj([nmgr.generateLogClearBuffer()])
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      done(data.rc !==0 ? data.rc : null , data);
      })
    );
};

var levelList = function(emitter, done){
  var stream = emitter.stream({objectMode: true});
  from2.obj([nmgr.generateLogLevelListBuffer()])
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      done(data.rc !==0 ? data.rc : null , data);
      })
    );
};

var moduleList = function(emitter, done){
  var stream = emitter.stream({objectMode: true});
  from2.obj([nmgr.generateLogModuleListBuffer()])
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      done(data.rc !==0 ? data.rc : null , data);
      })
    );
};

var list = function(emitter, done){
  var stream = emitter.stream({objectMode: true});
  from2.obj([nmgr.generateLogListBuffer()])
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
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
