var from2 = require('from2');
var to2 = require('flush-write-stream');
var through2 = require('through2');
var nmgr = require('../../nmgr');
var protocol = require('./protocol');
var utility = require('../../utility');
var duplexify = require('duplexify');
var EventEmitter = require('events');
var debug = require('debug')('newtmgr-serial');


var stat = function(emitter, name, timeout, done){
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

  return pipeline(emitter, cmdList, timeout, done);
};

var taskstats = function(emitter, timeout, done){
  var cmdList = [nmgr.generateTaskStatsBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var mpstats = function(emitter, timeout, done){
  var cmdList = [nmgr.generateMPStatsBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var reset = function(emitter, timeout, done){
  var cmdList = [nmgr.generateResetBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var echo = function(emitter, status, timeout, done){
  var cmd = {};
  cmd.echo = status;
  var cmdList = [nmgr.generateEchoBuffer(cmd)];
  return pipeline(emitter, cmdList, timeout, done);
};

var show = function(emitter, name, timeout, done){
  if (typeof(name) === 'function') {
    done = name;
    name = "";
  }

  var cmd = { index: 0, log_name: name, ts: 0 };
  var cmdList = [nmgr.generateLogShowBuffer(cmd)];
  return pipeline(emitter, cmdList, timeout, done);
};

var clear = function(emitter, timeout, done){
  var cmdList = [nmgr.generateLogClearBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var levelList = function(emitter, timeout, done){
  var cmdList = [nmgr.generateLogLevelListBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var moduleList = function(emitter, timeout, done){
  var cmdList = [nmgr.generateLogModuleListBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var logList = function(emitter, timeout, done){
  var cmdList = [nmgr.generateLogListBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var upload = function(emitter, fileBuffer, timeout, done){
  var maxFrag = 64; //ive seen up to 424 on osx, newt tool uses 64
  var gate = utility.gater();
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  var chunks = utility.chunk(fileBuffer, maxFrag);
  var statusEmitter = new EventEmitter();

  from2(chunks)
    .pipe(gate) //gate one block and thus one command at a time
    .pipe(nmgr.imageUploadTransform(fileBuffer.length))
    .pipe(protocol.encode())
    .pipe(stream, {end: false}) //dont let fs end our stream before we get response, this is why pull streams are better
    .pipe(protocol.decode())
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (obj, enc, cb) {
      gate.emit('next'); //response received emit next block upstream
      if(obj.rc !== 0){
        this.end(); //find proper early exit cleanup that doesnt leak
        done(obj.rc, obj);
        return cb();
      }
      if(obj.off === fileBuffer.length) //if this is last chunk flush fs
      {
        stream.end(); //since we blocked ending, manually end
        done(obj.rc !==0 ? obj.rc : null , obj);
      }
      statusEmitter.emit('status', obj);
      cb(); //callback writable
      })
    );
  return statusEmitter;
};

var test = function(emitter, hashBuffer, timeout, done){
  var cmd = {};
  cmd.confirm = false;
  cmd.hash = hashBuffer;
  var cmdList = [nmgr.generateImageTestBuffer(cmd)];
  return pipeline(emitter, cmdList, timeout, done);
};

var imageList = function(emitter, timeout, done){
  var cmdList = [nmgr.generateImageListBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var confirm = function(emitter, hashBuffer, timeout, done){
  var cmd = {};
  cmd.confirm = true;
  cmd.hash = hashBuffer;
  var cmdList = [nmgr.generateImageConfirmBuffer(cmd)];
  return pipeline(emitter, cmdList, timeout, done);
};

var corelist = function(emitter, timeout, done){
  var cmdList = [nmgr.generateImageCoreListBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var pipeline = function(emitter, cmdList, timeout, done){
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  var timedout = function(){
    stream.end();
    return done(new Error("timed out"));
  };
  var timeoutID = setTimeout(timedout, timeout);

  return from2.obj(cmdList)
    .pipe(protocol.encode())
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(protocol.decode())
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      clearTimeout(timeoutID);
      done(data.rc !==0 ? data.rc : null , data);
      })
    );
}


var log = {
  show: show,
  clear: clear,
  levelList: levelList,
  moduleList: moduleList,
  list: logList
};

var image = {
  upload: upload,
  test: test,
  list: imageList,
  confirm: confirm,
  corelist: corelist
};

module.exports = {
  reset: reset,
  echo: echo,
  stat: stat,
  log: log,
  image: image,
  taskstats: taskstats,
  mpstats: mpstats,
  protocol: protocol,
  pipeline: pipeline
};
