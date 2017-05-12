var from2 = require('from2');
var to2 = require('flush-write-stream');
var through2 = require('through2');
var nmgr = require('../../nmgr');
var protocol = require('./protocol');
var utility = require('../../utility');
var duplexify = require('duplexify');
var EventEmitter = require('events');
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

  return pipeline(emitter, cmdList, done);
};

var taskstats = function(emitter, done){
  var cmdList = [nmgr.generateTaskStatsBuffer()];
  return pipeline(emitter, cmdList, done);
};

var mpstats = function(emitter, done){
  var cmdList = [nmgr.generateMPStatsBuffer()];
  return pipeline(emitter, cmdList, done);
};

var reset = function(emitter, done){
  var cmdList = [nmgr.generateResetBuffer()];
  return pipeline(emitter, cmdList, done);
};

var echo = function(emitter, status, done){
  var cmd = {};
  cmd.echo = status;
  var cmdList = [nmgr.generateEchoBuffer(cmd)];
  return pipeline(emitter, cmdList, done);
};

var show = function(emitter, name, done){
  if (typeof(name) === 'function') {
    done = name;
    name = "";
  }

  var cmd = { index: 0, log_name: name, ts: 0 };
  var cmdList = [nmgr.generateLogShowBuffer(cmd)];
  return pipeline(emitter, cmdList, done);
};

var clear = function(emitter, done){
  var cmdList = [nmgr.generateLogClearBuffer()];
  return pipeline(emitter, cmdList, done);
};

var levelList = function(emitter, done){
  var cmdList = [nmgr.generateLogLevelListBuffer()];
  return pipeline(emitter, cmdList, done);
};

var moduleList = function(emitter, done){
  var cmdList = [nmgr.generateLogModuleListBuffer()];
  return pipeline(emitter, cmdList, done);
};

var logList = function(emitter, done){
  var cmdList = [nmgr.generateLogListBuffer()];
  return pipeline(emitter, cmdList, done);
};

var upload = function(emitter, fileBuffer, done){
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

var test = function(emitter, hashBuffer, done){
  var cmd = {};
  cmd.confirm = false;
  cmd.hash = hashBuffer;
  var cmdList = [nmgr.generateImageTestBuffer(cmd)];
  return pipeline(emitter, cmdList, done);
};

var imageList = function(emitter, done){
  var cmdList = [nmgr.generateImageListBuffer()];
  return pipeline(emitter, cmdList, done);
};

var confirm = function(emitter, hashBuffer, done){
  var cmd = {};
  cmd.confirm = true;
  cmd.hash = hashBuffer;
  var cmdList = [nmgr.generateImageConfirmBuffer(cmd)];
  return pipeline(emitter, cmdList, done);
};

var corelist = function(emitter, done){
  var cmdList = [nmgr.generateImageCoreListBuffer()];
  return pipeline(emitter, cmdList, done);
};

var pipeline = function(emitter, cmdList, done){
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  return from2.obj(cmdList)
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
