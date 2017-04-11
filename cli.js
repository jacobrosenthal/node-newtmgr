#! /usr/bin/env node

var argv = require('yargs').argv;
var from2 = require('from2');
var to2 = require('flush-write-stream');

var nmgr = require('./').nmgr;
var utility = require('./').utility;


if (argv.reset) {
  var cmdList = [nmgr.generateResetBuffer()]
}

if (argv.confirm) {
  var cmdList = [nmgr.generateConfirmBuffer(argv.hash)]
}

if (argv.list) {
  var cmdList = [nmgr.generateListBuffer()]
}

if (argv.test) {
  var cmdList = [nmgr.generateTestBuffer(argv.hash)];
}

if(argv.hasOwnProperty("echo")){
  var cmdList = [nmgr.generateEchoBuffer({echo: argv.echo})];
}

if(argv.serial){

  var SerialPort = require("serialport").SerialPort
  var serial = require('./').serial;

  var port = new SerialPort(argv.serial, { baudRate: 115200 }, function(){

    var dup = serial.duplex(port)

    from2(cmdList)
      .pipe(serial.encode())
      .pipe(dup, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(utility.hashToStringTransform())
      .pipe(to2.obj(function (data, enc, cb) {
        console.log(data);
        dup.end(); //since we blocked ending, manually end
        cb(); //callback writable
        }, process.exit)
      );
  });

}else if(argv.ble){

  var noble = require('noble');
  var ble = require('./').ble;

  var options = {
    services: ['8d53dc1d1db74cd3868b8a527460aa84'],
    characteristics: ['da2e7828fbce4e01ae9e261174997c48'],
    name: argv.ble
  };
  ble.connect(options, function(err, characteristic){

    var dup = ble.duplex(characteristic)

    from2(cmdList)
      .pipe(dup, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
      .pipe(nmgr.decode())
      .pipe(utility.hashToStringTransform())
      .pipe(to2.obj(function (data, enc, cb) {
        console.log(data);
        dup.end(); //since we blocked ending, manually end
        cb(); //callback writable
        }, process.exit)
      );
  });
}
