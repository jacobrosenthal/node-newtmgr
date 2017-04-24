var from2 = require('from2');
var to2 = require('flush-write-stream');
var nmgr = require('../../../nmgr');
var utility = require('../../../utility');
var EventEmitter = require('events');
var debug = require('debug')('newtmgr-ble-image');


var upload = function(emitter, fileBuffer, done){
  var maxFrag = 87; //has to be 32 or larger or imgmgr returns rc: 3, ive seen 450+ work, newt tool uses 87
  var gate = utility.gater();
  var stream = emitter.stream({objectMode: true});
  var chunks = utility.chunk(fileBuffer, maxFrag);
  var statusEmitter = new EventEmitter();

  from2(chunks)
    .pipe(gate) //gate one block and thus one command at a time
    .pipe(nmgr.imageUploadTransform(fileBuffer.length))
    .pipe(stream, {end: false}) //dont let fs end our stream before we get response, this is why pull streams are better
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
  var stream = emitter.stream({objectMode: true});
  var cmd = {};
  cmd.confirm = false;
  cmd.hash = hashBuffer;
  from2.obj([nmgr.generateImageTestBuffer(cmd)])
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
  from2.obj([nmgr.generateImageListBuffer()])
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      done(null, data); //image list doesnt have an rc??
      })
    );
};

var confirm = function(emitter, hashBuffer, done){
  var stream = emitter.stream({objectMode: true});
  var cmd = {};
  cmd.confirm = true;
  cmd.hash = hashBuffer;
  from2.obj([nmgr.generateImageConfirmBuffer(cmd)])
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      done(data.rc !==0 ? data.rc : null , data);
      })
    );
};

var corelist = function(emitter, done){
  var stream = emitter.stream({objectMode: true});
  from2.obj([nmgr.generateImageCoreListBuffer()])
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
  upload: upload,
  test: test,
  list: list,
  confirm: confirm,
  corelist: corelist
};
