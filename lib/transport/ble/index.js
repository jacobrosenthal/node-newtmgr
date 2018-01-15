var hasIn = require('lodash.hasin');
var has = require('lodash.has');
var from2 = require('from2');
var to2 = require('flush-write-stream');
var nmgr = require('../../nmgr');
var utility = require('../../utility');
var EventEmitter = require('events');
var debug = require('debug')('newtmgr-ble');


var scanAndConnect = function(noble, opts, cb) {
  if(!has(opts, 'names') && opts.name) {
    opts.names = [opts.name]
  }

  var onDiscover = function (peripheral) {
    //noble(apple devices) don't allow us to scan by name
    //web bluetooth scans by name, but doesnt allow multiple names, but does allow a namePrefix
    if(has(opts, 'namePrefix'))
    {
      //no matching needed
    }else if(hasIn(peripheral, 'advertisement.localName') && has(opts, 'names') && !opts.names.includes(peripheral.advertisement.localName))
    {
      //not the droid we're loking for
      return;
    }

    debug('onDiscover', peripheral.advertisement.localName);

    noble.removeListener('discover', onDiscover);
    noble.stopScanning();

    var onConnect = function (err) {
      debug('onConnect', err);
      if (err) return cb(err);

      var onDiscoverServices = function (err, services) {
        debug('onDiscoverServices', err);
        if (err) return cb(err);

          var onDiscoverCharacteristics = function (err, characteristics) {
            debug('onDiscoverCharacteristics', err);
            if (err) return cb(err);

            var onSubscribe = function(err){
              debug('onSubscribe', err);
              if (err) return cb(err);

              return cb(null, peripheral, characteristics[0]);
            };

            return characteristics[0].subscribe(onSubscribe);
          };

        return services[0].discoverCharacteristics(opts.characteristics, onDiscoverCharacteristics);
      };

      return peripheral.discoverServices(opts.services, onDiscoverServices);
    };

    peripheral.connect(onConnect);
  };

  noble.startScanning(opts, false);
  noble.on('discover', onDiscover);
};

var scan = function(noble, opts, cb) {

  var onDiscover = function (peripheral) {
    if(hasIn(peripheral, 'advertisement.localName') && has(opts, 'name') && (peripheral.advertisement.localName !== opts.name))
    {
      return;
    }
    debug('onDiscover', peripheral.advertisement.localName);

    noble.removeListener('discover', onDiscover);
    noble.stopScanning();

    return cb(null, peripheral);
  };

  noble.startScanning(opts, false);
  noble.on('discover', onDiscover);
};

var connect = function(peripheral, opts, cb) {
  var onConnect = function (err) {
    debug('onConnect', err);
    if (err) return cb(err);

    var onDiscoverServices = function (err, services) {
      debug('onDiscoverServices', err);
      if (err) return cb(err);

        var onDiscoverCharacteristics = function (err, characteristics) {
          debug('onDiscoverCharacteristics', err);
          if (err) return cb(err);

          var onSubscribe = function(err){
            debug('onSubscribe', err);
            if (err) return cb(err);

            return cb(null, characteristics[0]);
          };

          return characteristics[0].subscribe(onSubscribe);
        };

      return services[0].discoverCharacteristics(opts.characteristics, onDiscoverCharacteristics);
    };

    return peripheral.discoverServices(opts.services, onDiscoverServices);
  };

  peripheral.connect(onConnect);
};

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

var taskStats = function(emitter, timeout, done){
  var cmdList = [nmgr.generateTaskStatsBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var mpStats = function(emitter, timeout, done){
  var cmdList = [nmgr.generateMPStatsBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
}

var reset = function(emitter, timeout, done){
  var cmdList = [nmgr.generateResetBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var echo = function(emitter, status, timeout, done){
  var cmdList = [nmgr.generateEchoBuffer()];
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
  if(hashBuffer){
    cmd.hash = hashBuffer;
  }
  var cmdList = [nmgr.generateImageConfirmBuffer(cmd)];
  return pipeline(emitter, cmdList, timeout, done);
};

var corelist = function(emitter, timeout, done){
  var cmdList = [nmgr.generateImageCoreListBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var erase = function(emitter, timeout, done){
  var cmdList = [nmgr.generateImageEraseBuffer()];
  return pipeline(emitter, cmdList, timeout, done);
};

var pipeline = function(emitter, cmdList, timeout, done){
  var stream = emitter.stream({objectMode: true});
  var timedout = function(){
    stream.end();
    return done(new Error("timed out"));
  };
  var timeoutID = setTimeout(timedout, timeout);

  return from2.obj(cmdList)
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
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
  corelist: corelist,
  erase: erase
};

module.exports = {
  scan: scan,
  connect: connect,
  scanAndConnect: scanAndConnect,
  reset: reset,
  echo: echo,
  stat: stat,
  log: log,
  image: image,
  taskstats: taskstats,
  mpstats: mpstats,
  pipeline: pipeline
};
