// implements https://mynewt.apache.org/v1_0_0/os/modules/split/split/#split-apps
// node examples/ble-upload-scripted.js --name=nimble-blesplit --name=nimble-bleprph --app_name=blesplit.img --loader_name=bleprph.img
var argv = require('yargs').argv;
var utility = require('../').utility;
var async = require("async");
var fs = require('fs');
var noble = require('noble');
var transport = require('../').transport.ble;
var clone = require('clone');
var cmp = require('semver-compare-multi').cmp

var options = {
  timeoutSeconds: 30,
  services: ['8d53dc1d1db74cd3868b8a527460aa84'],
  characteristics: ['da2e7828fbce4e01ae9e261174997c48'],
  names: argv.name
};

var char;
var periph;

var exit = function(err) {
  if(!err){
    console.log("finished without errors")
    process.exit()
  }else{
    console.log("finished with errors")
    console.log(err.message || err)
    process.exit(1)
  }
}

var newLoader;
var loaderVersionString;
try {
  newLoader = fs.readFileSync(argv.loader_name);
  var major = newLoader.readUIntLE(20)
  var minor = newLoader.readUIntLE(21)
  var rev   = newLoader.readUIntLE(22)
  var build = newLoader.readUIntLE(24)  // TODO Probably a way to understand and write this LE better
  loaderVersionString = major + "." + minor + "." + rev + "." + build;
  console.log("loader version: " + loaderVersionString)
} catch (err) {
  return exit(err)
}

var newApp;
var appVersionString;
try {
  newApp = fs.readFileSync(argv.app_name);
  var major = newApp.readUIntLE(20)
  var minor = newApp.readUIntLE(21)
  var rev   = newApp.readUIntLE(22)
  var build = newApp.readUIntLE(24) // TODO Probably a way to understand and write this LE better
  appVersionString = major + "." + minor + "." + rev + "." + build;
  console.log("app version: " + appVersionString)
} catch (err) {
  return exit(err)
}

if(cmp(loaderVersionString, appVersionString) !== 0){
  return exit(new Error("loader and app version don't match?!"))
}

var print = function(err, obj){
  if(err){
    console.log(err.toString());
  }

  var obj2 = clone(obj);
  if (obj2){
    utility.prettyList(obj2);
    utility.prettyError(obj2);
    console.log(JSON.stringify(obj2, null, '\t'));
  }
};

var connect = function(callback){
  console.log("connecting");
  transport.scanAndConnect(noble, options, function(err, peripheral, characteristic){
    if(err){ return callback(err);}
    periph = peripheral;
    char = characteristic;
    console.log("connected and found characteristic");
    return callback();
  });
}

var reset = function(callback) {
  console.log("resetting");
  transport.reset(char, 5000, function(err){
    if(err){
      return callback(err);
    }
    periph.once('disconnect', callback);
  });
}

var confirm = function(callback){
  console.log("confirming");
  transport.image.confirm(char, null, 5000, function(err, obj){
    print(err, obj);
    return callback(err, obj);
  });
}

// workaround nrf51 devices that lose ble when they erase, so manually erase before upload
var eraseAndStayConnected = function(callback) {
  var calledBack = false
  console.log("erasing");

  var onDisconnect = function(){
    console.log("disconnected, reconnecting")
    calledBack = true;
    return connect(callback);
  };

  // nrf51 will disconnect so reconnect
  periph.once('disconnect', onDisconnect);
  transport.image.erase(char, 5000, function(err, obj){

    periph.removeListener('disconnect', onDisconnect)
    if(!calledBack){
      calledBack = true;
      return callback(err, obj);
    }
  });
}

var moveTo = function(hashBuffer, callback){
  console.log("move to hash: ", hashBuffer.toString('hex'));
  async.series([

    transport.image.test.bind(this, char, hashBuffer, 5000),
    reset,
    connect,

    function(callback2) {

      transport.image.list(char, 5000, function(err, obj){
        print(err, obj);

        var activeImage = obj.images.reverse().find(function(image){
          return image.active
        })

        if(activeImage && activeImage.hash.toString('hex') === hashBuffer.toString('hex')){
          return callback2();
        }else{
          return callback2(new Error("Couldn't boot hash"))
        }

      });
    }

  ], callback);
}

var moveToNewLoader = function(callback){
  console.log("move to new loader");
  transport.image.list(char, 5000, function(err, obj){
    print(err, obj);
    var newLoader = obj.images.find(function(element){
      return (element.bootable && !element.active);
    })
    return async.series([ moveTo.bind(this, newLoader.hash)], callback);
  });
}

var moveToNewApp = function(callback){
  console.log("move to new app");
  transport.image.list(char, 5000, function(err, obj){
    print(err, obj);
    var newApp = obj.images.find(function(element){
      return (!element.bootable && !element.active);
    })
    return async.series([ moveTo.bind(this, newApp.hash)], callback);
  });
}

var upload = function(fileBuffer, retries, callback){
  var printStatus;
  var status;

  var disconnected = function(){
    if(status){
      status.removeListener('status', printStatus);
    }
    if(retries--){
      console.log("disconnected, but trying again");
      return async.series([ connect, upload.bind(this, fileBuffer, retries--)], callback);
    }else{
      return callback(new Error("disconnected while writing bytes"))
    }
  }
  periph.once('disconnect', disconnected);

  console.log("scripting image_upload command", fileBuffer.length, "bytes");
  printStatus = function(obj){
    console.log(utility.prettyError(obj));
  }
  status = transport.image.upload(char, fileBuffer, 30000, function(err,obj){
    status.removeListener('status', printStatus);
    periph.removeListener('disconnect', disconnected);
    return callback(err,obj);
  });
  status.on('status', printStatus);
}

async.series([

  function(callback) {
    console.log("waiting for bluetooth");
    noble.once('stateChange', function(state){
      if (state === 'poweredOn') {
        return callback();
      }else{
        return callback(new Error("adapter not powered on"))
      }
    });
  },

  connect,

  function(callback) {
    console.log("checking image state");
    transport.image.list(char, 5000, function(err, obj){
      print(err, obj);

      // TODO: 0.0.0.0 is newer than 0.0.0 and will upload sadly...
      // check that new loader is greater version than on device or hash will match and we wont be able to move to it
      if(!(cmp(loaderVersionString, obj.images[0].version) > 0))
      {
        return callback(new Error("Loader image not newer than on device"))
      }

      // https://mynewt.apache.org/master/os/modules/split/split/
      // seems like newt attempts to keep the loader in slot0 somehow on their end??
      if(obj.images.length==2 && obj.images[1].active){

        console.log("were in the app")
        return async.series([
          moveTo.bind(this,obj.images[0].hash),
          confirm,
          eraseAndStayConnected], callback);
      }else {
        if(obj.images.length==2 && obj.images[1].confirmed){

          console.log("2 images and were in the loader but app is confirmed")
          return async.series([
            confirm,
            eraseAndStayConnected], callback);
        }else if(obj.images.length==2 && !obj.images[1].confirmed){

          console.log("2 images, and were in the loader")
          return async.series([
            eraseAndStayConnected], callback);

        }else{

          console.log("1 image and were in the loader")
          return callback();
        }
      }

    });
  },

  upload.bind(this, newLoader, 5),
  moveToNewLoader,
  confirm,
  eraseAndStayConnected,
  upload.bind(this, newApp, 5),
  moveToNewApp,
  confirm,

], exit);
