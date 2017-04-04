#! /usr/bin/env node

var from2 = require('from2');
var argv = require('yargs').argv;
var to2 = require('flush-write-stream');
var through2 = require('through2');

var nmgr = require('./').nmgr;
var serial = require('./').serial;

var options = {
  services: ['8d53dc1d1db74cd3868b8a527460aa84'],
  characteristics: ['da2e7828fbce4e01ae9e261174997c48'],
  name: argv.ble
};

var complete = function() {
  return to2.obj(function (chunk, enc, callback) {
    console.log(chunk);
    callback();
    process.exit(0)
  })
};

var go = function(err, ch){

  if (argv.reset && argv.serial) {
    from2([nmgr.generateResetBuffer()])
      .pipe(serial.encode())
      .pipe(port)
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(complete());
  }

  if (argv.confirm && argv.serial) {
    from2([nmgr.generateConfirmBuffer()])
      .pipe(serial.encode())
      .pipe(port)
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(complete());
  }

  if (argv.list && argv.serial) {
    from2([nmgr.generateListBuffer()])
      .pipe(serial.encode())
      .pipe(port)
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(complete());
  }

  if (argv.multiple && argv.serial) {
    from2([nmgr.generateListBuffer()])
      .pipe(serial.encode())
      .pipe(port, {end:false}) //dont let from2 close stream so we can use it again
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(through2.obj(function(chunk, enc, cb){
        console.log(chunk);
        return cb(null, nmgr.generateResetBuffer());
      }))
      .pipe(serial.encode())
      .pipe(port)
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(complete());
  }

  if (argv.test && argv.serial) {
    from2([nmgr.generateTestBuffer(argv.hash)])
      .pipe(serial.encode())
      .pipe(port)
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(complete());
  }

  if (argv.reset && argv.ble) {
    var stream = ble.createStream(ch, nmgr.generateResetBuffer())

    stream
      .pipe(nmgr.decode())
      .pipe(complete());
  }

  if (argv.confirm && argv.ble) {
    var stream = ble.createStream(ch, nmgr.generateConfirmBuffer())

    stream
      .pipe(nmgr.decode())
      .pipe(complete());
  }

  if (argv.list && argv.ble) {
    var stream = ble.createStream(ch, nmgr.generateListBuffer())

    stream
      .pipe(nmgr.decode())
      .pipe(complete());
  }

  if (argv.multiple && argv.ble) {
    //kind of a shit show, but ble has listeners inside and for multiple commands were going to need to manually destroy
    var stream = ble.createStream(ch, nmgr.generateListBuffer())

    var next = function() {
      return to2.obj(function (chunk, enc, callback) {
        stream.destroy(); //yeah I agree
        console.log(chunk);

        stream = ble.createStream(ch, nmgr.generateResetBuffer())
          .pipe(nmgr.decode())
          //if were werent exiting would have to stream.destroy here
          .pipe(complete());

        return callback();
      })
    };

    stream
      .pipe(nmgr.decode())
      .pipe(next());
  }

  if (argv.test && argv.ble) {
    var stream = ble.createStream(ch, generateTestBuffer(argv.hash))

    stream
      .pipe(nmgr.decode())
      .pipe(complete());
  }
}

if(argv.serial){
  var SerialPort = require('serialport');
  var port = new SerialPort(argv.serial, {
      baudRate: 115200
    });
  go();
}else if(argv.ble){
  var ble = require('./ble');
  ble.connect(options, go);
}
