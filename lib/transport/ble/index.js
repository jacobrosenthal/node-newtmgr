var noble = require('noble');
var hasIn = require('lodash.hasin');
var has = require('lodash.has');
var from2 = require('from2');
var to2 = require('flush-write-stream');
var nmgr = require('../../nmgr');
var log = require('./log');
var image = require('./image');
var debug = require('debug')('newtmgr-ble');


var connect = function(opts, cb) {

  var onStateChange = function (state) {
    debug('onStateChange');
    if (state === 'poweredOn') {
      noble.startScanning(opts, false);
    } else {
      noble.stopScanning();
    }
  };

  var onDiscover = function (peripheral) {
    if(hasIn(peripheral, 'advertisement.localName') && has(opts, 'name') && (peripheral.advertisement.localName !== opts.name))
    {
      return;
    }
    debug('onDiscover', peripheral.advertisement.localName);

    noble.removeListener('stateChange', onStateChange);
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

   var onDisconnect = function(err){
    debug('onDisconnect', err);
   };

    peripheral.once('disconnect', onDisconnect);
    peripheral.connect(onConnect);
  };

  noble.on('stateChange', onStateChange);
  noble.on('discover', onDiscover);
};

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

  var stream = emitter.stream({objectMode: true});
  from2.obj(cmdList)
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      done(data.rc !==0 ? data.rc : null , data);
      })
    );
};

var reset = function(emitter, done){
  var stream = emitter.stream({objectMode: true});
  from2.obj([nmgr.generateResetBuffer()])
    .pipe(stream, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      stream.end(); //since we blocked ending, manually end
      cb(); //callback writable
      done(data.rc !==0 ? data.rc : null , data);
      })
    );
};

var echo = function(emitter, status, done){
  var stream = emitter.stream({objectMode: true});
  var cmd = {};
  cmd.echo = status;
  from2.obj([nmgr.generateEchoBuffer(cmd)])
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
  connect: connect,
  reset: reset,
  echo: echo,
  stat: stat,
  log: log,
  image: image
};
