var SerialPort = require('serialport');
var noble = require('noble');
var createStream = require('./ble');

var through2 = require('through2');
var from2 = require('from2');

var nmgr = require('./nmgr');
var serial = require('./serial');

var NMGR_SVC_UUID = '8d53dc1d1db74cd3868b8a527460aa84';
var NMGR_CHAR_UUID = 'da2e7828fbce4e01ae9e261174997c48';
var name = 'nimble-bleprph';


if (process.argv.indexOf('--reset-serial') !== -1) {

  var stream = new SerialPort('/dev/tty.usbmodem1411', {
    baudRate: 115200
  });

  stream.on('end', function(){
    process.exit(0)
  })

  var listen = through2.obj(function (chunk, enc, callback) {
    console.log(chunk);
    process.exit(0)
  });

  // from2 will close transport on you, so only use if you only want to do one operation
  from2([nmgr.generateResetBuffer()])
    .pipe(serial.encode())
    .pipe(stream);

  stream
    .pipe(serial.decode())
    .pipe(nmgr.decode())
    .pipe(listen);
}


if (process.argv.indexOf('--list-serial') !== -1) {

  var stream = new SerialPort('/dev/tty.usbmodem1411', {
    baudRate: 115200
  });

  stream.on('end', function(){
    process.exit(0)
  })

  var listen = through2.obj(function (chunk, enc, callback) {
    console.log(chunk);
    process.exit(0)
  });

  from2([nmgr.generateListBuffer()])
    .pipe(serial.encode())
    .pipe(stream);

  stream
    .pipe(serial.decode())
    .pipe(nmgr.decode())
    .pipe(listen);
}


if (process.argv.indexOf('--reset-ble') !== -1) {

  var stream = createStream({name, serviceUuid:NMGR_SVC_UUID, characteristicUuid: NMGR_CHAR_UUID});

  stream.on('end', function(){
    process.exit(0)
  })

  var listen = through2.obj(function (chunk, enc, callback) {
    console.log(chunk);
    process.exit(0)
  });

  // from2 will close transport on you, so only use if you only want to do one operation
  from2([nmgr.generateResetBuffer()])
    .pipe(stream);

  stream
    .pipe(nmgr.decode())
    .pipe(listen);
}


if (process.argv.indexOf('--list-ble') !== -1) {

  var stream = createStream({name, serviceUuid:NMGR_SVC_UUID, characteristicUuid: NMGR_CHAR_UUID});

  stream.on('end', function(){
    process.exit(0)
  })

  var listen = through2.obj(function (chunk, enc, callback) {
    console.log(chunk);
    process.exit(0)
  });

  // from2 will close transport on you, so only use if you only want to do one operation
  from2([nmgr.generateListBuffer()])
    .pipe(stream);

  stream
    .pipe(nmgr.decode())
    .pipe(listen);
}
