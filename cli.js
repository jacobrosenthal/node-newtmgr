#! /usr/bin/env node

var argv = require('yargs').argv;
var from2 = require('from2');
var to2 = require('flush-write-stream');
var through2 = require('through2');

var nmgr = require('./').nmgr;
var utility = require('./').utility;

if(argv.serial){
  var SerialPort = require('serialport');
  var serial = require('./').serial;

  var stream = new SerialPort(argv.serial, {
    baudRate: 115200
  });
  goSerial(null, stream)
}else if(argv.ble){
  var noble = require('noble');
  var ble = require('./').ble;

  var options = {
    services: ['8d53dc1d1db74cd3868b8a527460aa84'],
    characteristics: ['da2e7828fbce4e01ae9e261174997c48'],
    name: argv.ble
  };
  ble.connect(options, goBle);
}

function goSerial (err, port) {
  if (argv.reset) {
    from2([nmgr.generateResetBuffer()])
      .pipe(serial.encode())
      .pipe(port)
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (chunk, enc, callback) {
        console.log(chunk);
        callback();
        process.exit(0);
      }));
  }

  if (argv.confirm) {
    from2([nmgr.generateConfirmBuffer()])
      .pipe(serial.encode())
      .pipe(port)
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (chunk, enc, callback) {
        console.log(chunk);
        callback();
        process.exit(0);
      }));
  }

  if (argv.list) {
    from2([nmgr.generateListBuffer()])
      .pipe(serial.encode())
      .pipe(port)
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(utility.hashToStringTransform())
      .pipe(to2.obj(function (chunk, enc, callback) {
        console.log(chunk);
        callback();
        process.exit(0);
      }));
  }

  if (argv.test) {
    from2([nmgr.generateTestBuffer(argv.hash)])
      .pipe(serial.encode())
      .pipe(port)
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (chunk, enc, callback) {
        console.log(chunk);
        callback();
        process.exit(0);
      }));
  }

  if (argv.testandreset) {

    var next = function(){

      from2([nmgr.generateResetBuffer()])
        .pipe(serial.encode())
        .pipe(port, {end:false}) //dont let from2 close port

      var stream = utility.emitterStream(port);
       stream
        .pipe(serial.decode())
        .pipe(nmgr.decode())
        .pipe(to2.obj(function (chunk, enc, callback) {
          stream.push(null); //close previous instance of emitterStream so we dont have dangling listeners
          console.log(chunk);
          callback();
          process.exit(0);
        }));
    }

    from2([nmgr.generateTestBuffer(argv.hash)])
      .pipe(serial.encode())
      .pipe(port, {end:false}) //dont let from2 close port

    var stream = utility.emitterStream(port);
     stream
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (chunk, enc, callback) {
        stream.push(null); //close previous instance of emitterStream so we dont have dangling listeners
        console.log(chunk);
        callback();
        //until I find a way to pause streams from hardware devices ...
        next();
      }));
  }
}

function goBle (err, characteristic) {

  if (argv.reset) {
    characteristic.write(nmgr.generateResetBuffer(), true);

    var stream = utility.emitterStream(characteristic);
    stream
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (chunk, enc, callback) {
        stream.push(null); //close previous instance of emitterStream so we dont have dangling listeners
        console.log(chunk);
        callback();
        process.exit(0);
      }));
  }

  if (argv.confirm) {
    characteristic.write(nmgr.generateConfirmBuffer(), true);

    var stream = utility.emitterStream(characteristic);
    stream
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (chunk, enc, callback) {
        stream.push(null); //close previous instance of emitterStream so we dont have dangling listeners
        console.log(chunk);
        callback();
        process.exit(0);
      }));
  }

  if (argv.list) {
    characteristic.write(nmgr.generateListBuffer(), true);

    var stream = utility.emitterStream(characteristic);
    stream
      .pipe(nmgr.decode())
      .pipe(utility.hashToStringTransform())
      .pipe(to2.obj(function (chunk, enc, callback) {
        stream.push(null); //close previous instance of emitterStream so we dont have dangling listeners
        console.log(chunk);
        callback();
        process.exit(0);
      }));
  }

  if (argv.test) {
    characteristic.write(nmgr.generateTestBuffer(argv.hash), true);

    var stream = utility.emitterStream(characteristic);
    stream
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (chunk, enc, callback) {
        stream.push(null); //close previous instance of emitterStream so we dont have dangling listeners
        console.log(chunk);
        callback();
        process.exit(0);
      }));
  }


  if (argv.testandreset) {

    var next = function(){
      characteristic.write(nmgr.generateResetBuffer(argv.hash), true);

      var stream = utility.emitterStream(characteristic);
      stream
        .pipe(nmgr.decode())
        .pipe(to2.obj(function (chunk, enc, callback) {
          stream.push(null); //close previous instance of emitterStream so we dont have dangling listeners
          console.log(chunk);
          callback();
          process.exit(0);
        }));
    }

    characteristic.write(nmgr.generateTestBuffer(argv.hash), true);

    var stream = utility.emitterStream(characteristic);
    stream
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (chunk, enc, callback) {
        stream.push(null); //close previous instance of emitterStream so we dont have dangling listeners
        console.log(chunk);
        callback();
        //until I find a way to pause streams from hardware devices ... 
        next();
      }));
  }
}
