var noble = require('noble')
var hasIn = require('lodash.hasin');
var has = require('lodash.has');
var debug = require('debug')('newtmgr-ble')
var Pushable = require('pull-pushable')


var connect = function(opts, cb) {

  var onStateChange = function (state) {
    debug('onStateChange')
    if (state === 'poweredOn') {
      noble.startScanning(opts, false)
    } else {
      noble.stopScanning()
    }
  }

  var onDiscover = function (peripheral) {
    if(hasIn(peripheral, 'advertisement.localName') && has(opts, 'name') && (peripheral.advertisement.localName !== opts.name))
    {
      return;
    }
    debug('onDiscover', peripheral.advertisement.localName)

    noble.removeListener('stateChange', onStateChange)
    noble.removeListener('discover', onDiscover)
    noble.stopScanning()

    var onConnect = function (err) {
      debug('onConnect', err)
      if (err) return cb(err)

      var onDiscoverServices = function (err, services) {
        debug('onDiscoverServices', err)
        if (err) return cb(err)

          var onDiscoverCharacteristics = function (err, characteristics) {
            debug('onDiscoverCharacteristics', err)
            if (err) return cb(err)

            var onSubscribe = function(err){
              debug('onSubscribe', err)
              if (err) return cb(err)

              return cb(null, characteristics[0]);
            }

            return characteristics[0].subscribe(onSubscribe);
          }

        return services[0].discoverCharacteristics(opts.characteristics, onDiscoverCharacteristics);
      };

      return peripheral.discoverServices(opts.services, onDiscoverServices);
    }

   var onDisconnect = function(err){
    debug('onDisconnect', err);
   }

    peripheral.once('disconnect', onDisconnect);
    peripheral.connect(onConnect);
  }

  noble.on('stateChange', onStateChange)
  noble.on('discover', onDiscover)

  //hack for webble, whose statechange isnt good yet
  if(opts && opts.nowait){
    noble.emit('stateChange', 'poweredOn');
  }
}

//pull-stream sink for ble characteristic
function writerPull (characteristic) {
  return function (read) {
    read(null, function next(end, data) {
      if(end === true) return
      if(end) throw end

      characteristic.write(data, true, function(err){
        if(err) return read(true, next)
        return read(null, next)
      });
    })
  }
}

// easier methond of {sink: ble.writer(characteristic), source: toPull.source(characteristic)},
// gives the wrapped node-stream does not implement `destroy`, this may cause resource leaks.
// (node:6856) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 close listeners added. Use emitter.setMaxListeners() to increase limit
// so listen and unlisten ourselves
function duplexPull (characteristic){

  var p = Pushable(function (err) {
    characteristic.removeListener('data', onData)
  })

  var onData = function(data){
    p.push(data)
  }

  characteristic.on('data', onData);
  return {sink: writerPull(characteristic), source: p};
}


module.exports = {connect, writerPull, duplexPull}
