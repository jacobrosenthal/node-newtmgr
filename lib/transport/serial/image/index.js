var duplexify = require('duplexify');
var from2 = require('from2');
var to2 = require('flush-write-stream');
var nmgr = require('../../../nmgr');
var utility = require('../../../utility');
var protocol = require('../protocol');
var EventEmitter = require('events');
var debug = require('debug')('newtmgr-serial-image');


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
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  var cmd = {};
  cmd.confirm = false;
  cmd.hash = hashBuffer;
  from2.obj([nmgr.generateImageTestBuffer(cmd)])
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
  from2.obj([nmgr.generateImageListBuffer()])
    .pipe(protocol.encode())
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(protocol.decode())
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      done(null, data); //image list doesnt have an rc??
      })
    );
};

var confirm = function(emitter, hashBuffer, done){
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  var cmd = {};
  cmd.confirm = true;
  cmd.hash = hashBuffer;
  from2.obj([nmgr.generateImageConfirmBuffer(cmd)])
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

var corelist = function(emitter, done){
  var stream = utility.emitterDuplex(emitter, {objectMode: true});
  from2.obj([nmgr.generateImageCoreListBuffer()])
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
  upload: upload,
  test: test,
  list: list,
  confirm: confirm,
  corelist: corelist
};
