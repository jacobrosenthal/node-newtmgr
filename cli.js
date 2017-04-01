#! /usr/bin/env node

var through2 = require('through2');
var from2 = require('from2');
var argv = require('yargs').argv;

var nmgr = require('./').nmgr;
var serial = require('./').serial;

var stream;

if(argv.serial){
  var SerialPort = require('serialport');
  stream = new SerialPort(argv.serial, {
    baudRate: 115200
  });
}else if(argv.ble){
  var noble = require('noble');
  var createStream = require('./ble');

  var NMGR_SVC_UUID = '8d53dc1d1db74cd3868b8a527460aa84';
  var NMGR_CHAR_UUID = 'da2e7828fbce4e01ae9e261174997c48';

  stream = createStream({name:argv.ble, serviceUuid:NMGR_SVC_UUID, characteristicUuid: NMGR_CHAR_UUID});
}

stream.on('end', function(){
  process.exit(0)
})

var listen = through2.obj(function (chunk, enc, callback) {
  console.log(chunk);
  process.exit(0)
});

if (argv.reset && argv.serial) {
  // from2 will close transport on you, so only use if you only want to do one operation
  from2([nmgr.generateResetBuffer()])
    .pipe(serial.encode())
    .pipe(stream);

  stream
    .pipe(serial.decode())
    .pipe(nmgr.decode())
    .pipe(listen);
}

if (argv.list && argv.serial) {
  // from2 will close transport on you, so only use if you only want to do one operation
  from2([nmgr.generateListBuffer()])
    .pipe(serial.encode())
    .pipe(stream);

  stream
    .pipe(serial.decode())
    .pipe(nmgr.decode())
    .pipe(listen);
}

if (argv.reset && argv.ble) {
  // from2 will close transport on you, so only use if you only want to do one operation
  from2([nmgr.generateResetBuffer()])
    .pipe(stream);

  stream
    .pipe(nmgr.decode())
    .pipe(listen);
}

if (argv.list && argv.ble) {
  // from2 will close transport on you, so only use if you only want to do one operation
  from2([nmgr.generateListBuffer()])
    .pipe(stream);

  stream
    .pipe(nmgr.decode())
    .pipe(listen);
}
