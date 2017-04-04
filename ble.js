var noble = require('noble')
var hasIn = require('lodash.hasin');
var has = require('lodash.has');
var debug = require('debug')('newtmgr-ble')


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

module.exports = {connect}
