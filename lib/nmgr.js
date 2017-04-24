var through2 = require('through2');
var cbor = require('cbor-sync');
var pipeline = require('pumpify');
var CONSTANTS = require('./constants');
var debug = require('debug')('newtmgr');


// &{Op:0 Flags:0 Len:1 Group:2 Seq:0 Id:1 Data:[160]}
function generateStatListBuffer()
{
  var nmr = {};
  nmr.Data = Buffer.alloc(0);
  nmr.Op = CONSTANTS.NMGR_OP_READ;
  nmr.Flags = 0;
  nmr.Len = 0;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_STATS;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.STATS_NMGR_OP_LIST;

  return _serialize(nmr);
}

// { name: 'dog' }
function generateStatReadBuffer(cmd)
{
  var encoded = cbor.encode(cmd);

  var nmr = {};
  nmr.Data = encoded;
  nmr.Op = CONSTANTS.NMGR_OP_READ;
  nmr.Flags = 0;
  nmr.Len = encoded.length;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_STATS;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.STATS_NMGR_OP_READ;

  return _serialize(nmr);
}

//&{Op:2 Flags:0 Len:1 Group:4 Seq:0 Id:1 Data:[160]}
function generateLogClearBuffer()
{
  var nmr = {};
  nmr.Data = Buffer.alloc(0);
  nmr.Op = CONSTANTS.NMGR_OP_WRITE;
  nmr.Flags = 0;
  nmr.Len = 0;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_LOGS;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.LOGS_NMGR_OP_CLEAR;

  return _serialize(nmr);
}

//&{Op:0 Flags:0 Len:1 Group:4 Seq:0 Id:4 Data:[160]}
function generateLogLevelListBuffer()
{
  var nmr = {};
  nmr.Data = Buffer.alloc(0);
  nmr.Op = CONSTANTS.NMGR_OP_READ;
  nmr.Flags = 0;
  nmr.Len = 0;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_LOGS;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.LOGS_NMGR_OP_LEVEL_LIST;

  return _serialize(nmr);
}

//&{Op:0 Flags:0 Len:1 Group:4 Seq:0 Id:5 Data:[160]}
function generateLogListBuffer()
{
  var nmr = {};
  nmr.Data = Buffer.alloc(0);
  nmr.Op = CONSTANTS.NMGR_OP_READ;
  nmr.Flags = 0;
  nmr.Len = 0;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_LOGS;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.LOGS_NMGR_OP_LOGS_LIST;

  return _serialize(nmr);
}

//&{Op:0 Flags:0 Len:1 Group:4 Seq:0 Id:3 Data:[160]} 
function generateLogModuleListBuffer()
{
  var nmr = {};
  nmr.Data = Buffer.alloc(0);
  nmr.Op = CONSTANTS.NMGR_OP_READ;
  nmr.Flags = 0;
  nmr.Len = 0;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_LOGS;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.LOGS_NMGR_OP_MODULE_LIST;

  return _serialize(nmr);
}

// { index: 0, log_name: 'reboot_log', ts: 0 }
function generateLogShowBuffer(cmd)
{
  var encoded = cbor.encode(cmd);

  var nmr = {};
  nmr.Data = encoded;
  nmr.Op = CONSTANTS.NMGR_OP_READ;
  nmr.Flags = 0;
  nmr.Len = encoded.length;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_LOGS;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.LOGS_NMGR_OP_READ;

  return _serialize(nmr);
}

function generateResetBuffer()
{
  var nmr = {};
  nmr.Data = Buffer.alloc(0);
  nmr.Op = CONSTANTS.NMGR_OP_WRITE;
  nmr.Flags = 0;
  nmr.Len = 0;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_DEFAULT;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.NMGR_ID_RESET;

  return _serialize(nmr);
}

//  var cmd = {echo: 0}
function generateEchoBuffer(cmd){

  var encoded = cbor.encode(cmd);

  var nmr = {};
  nmr.Data = encoded;
  nmr.Op = CONSTANTS.NMGR_OP_WRITE;
  nmr.Flags = 0;
  nmr.Len = encoded.length;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_DEFAULT;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.NMGR_ID_CONS_ECHO_CTRL;

  return _serialize(nmr);
}

function generateImageTestBuffer(cmd)
{
  var encoded = cbor.encode(cmd);

  var nmr = {};
  nmr.Data = encoded;
  nmr.Op = CONSTANTS.NMGR_OP_WRITE;
  nmr.Flags = 0;
  nmr.Len = encoded.length;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_IMAGE;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.IMGMGR_NMGR_ID_STATE;

  return _serialize(nmr);
}

function generateImageConfirmBuffer(cmd)
{
  var encoded = cbor.encode(cmd);

  var nmr = {};
  nmr.Data = encoded;
  nmr.Op = CONSTANTS.NMGR_OP_WRITE;
  nmr.Flags = 0;
  nmr.Len = encoded.length;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_IMAGE;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.IMGMGR_NMGR_ID_STATE;

  return _serialize(nmr);
}

function generateImageListBuffer()
{
  var nmr = {};
  nmr.Data = Buffer.alloc(0);
  nmr.Op = CONSTANTS.NMGR_OP_READ;
  nmr.Flags = 0;
  nmr.Len = 0;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_IMAGE;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.IMGMGR_NMGR_ID_STATE;

  return _serialize(nmr);
}

//&{Op:0 Flags:0 Len:0 Group:1 Seq:0 Id:3 Data:[]}
function generateImageCoreListBuffer(){
  var nmr = {};
  nmr.Data = Buffer.alloc(0);
  nmr.Op = CONSTANTS.NMGR_OP_READ;
  nmr.Flags = 0;
  nmr.Len = 0;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_IMAGE;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.IMGMGR_NMGR_ID_CORELIST;

  return _serialize(nmr);
}

// var cmd = {}
// cmd.data = Buffer.from([0x3c, 0xb8, 0xf3, 0x96, 0x24, 0x00, 0x00, 0x00, 0x20, 0x00, 0x00, 0x00, 0x48, 0x10, 0x00, 0x00, 0x12, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x40, 0x00, 0x20, 0x29, 0x38, 0x02, 0x00, 0x00, 0x1a, 0x80, 0xf3, 0x14, 0x88, 0x80, 0xf3, 0x10, 0x88, 0x03, 0x21, 0x18, 0x48, 0x02, 0x68]);
// cmd.len = 4236;
// cmd.off = 0;
function generateImageUploadBuffer(cmd){
  var encoded = cbor.encode(cmd);

  var nmr = {};
  nmr.Data = encoded;
  nmr.Op = CONSTANTS.NMGR_OP_WRITE;
  nmr.Flags = 0;
  nmr.Len = encoded.length;
  nmr.Group = CONSTANTS.NMGR_GROUP_ID_IMAGE;
  nmr.Seq = 0;
  nmr.Id = CONSTANTS.IMGMGR_NMGR_ID_UPLOAD;

  return _serialize(nmr);
}

function imageUploadTransform(fileSize) {
  var currOff  = 0;

  function transform(data, enc, cb) {
    debug("imageUploadTransform", data.toString('hex'));

    var imageUpload = {};
    imageUpload.off = currOff;
    imageUpload.data = data;

    //only send len on first packet
    if (currOff === 0){
      imageUpload.len = fileSize;
    }

    currOff+=data.length;

    var imageUploadBuffer = generateImageUploadBuffer(imageUpload);
    return cb(null, imageUploadBuffer);
  }

  return through2.obj(transform, function(cb){debug("flush imageUploadTransform");cb();});
}

function _serialize(nmr){

  var buf = Buffer.alloc(8);

  buf.writeUInt8(nmr.Op, 0);
  buf.writeUInt8(nmr.Flags, 1);

  buf.writeUInt16BE(nmr.Len, 2);
  buf.writeUInt16BE(nmr.Group, 4);

  buf.writeUInt8(nmr.Seq, 6);
  buf.writeUInt8(nmr.Id, 7);

  var out = Buffer.concat([buf, nmr.Data]);
  debug("_serialize ", nmr, " into ", out.toString('hex'));
  return out;
}

function decode(){
  return pipeline.obj(_accumulate(), _decode());
}

function _decode() {

  function transform(data, enc, cb) {
    debug("_decode", data);
    var decoded = cbor.decode(data.Data);
    return cb(null, decoded);
  }

  return through2.obj(transform, function(cb){debug("flush _decode");cb();});
}

function _accumulate() {
  var header;
  var nonmgrhdr = false;

  function transform(data, enc, cb) {
    debug("_accumulate", data.toString('hex'));

    if (!nonmgrhdr) {

      if(data.length < 8){
        return cb(new Error("Newtmgr request buffer too small"));
      }
      var _header = _deserialize(data);
      if(_header && (_header.Op === CONSTANTS.NMGR_OP_READ_RSP || _header.Op ===CONSTANTS.NMGR_OP_WRITE_RSP)){
        header = _header;
      }
    }

    if(typeof header !== 'undefined'){
      if(nonmgrhdr){
        header.Data = Buffer.concat([header.Data, data]);
      }

      if(header.Data.length >= header.Len){
        this.push(header);
        header = undefined;
        nonmgrhdr = false;
      }else{
        nonmgrhdr = true;
      }
    }
    return cb();
  }

  return through2.obj(transform, function(cb){debug("flush _accumulate");cb();});
}

function _deserialize(serializedBuffer){
  nmr = {};
  nmr.Op = serializedBuffer.readUInt8(0);
  nmr.Flags = serializedBuffer.readUInt8(1);
  nmr.Len = serializedBuffer.readUInt16BE(2);
  nmr.Group = serializedBuffer.readUInt16BE(4);
  nmr.Seq = serializedBuffer.readUInt8(6);
  nmr.Id = serializedBuffer.readUInt8(7);
  nmr.Data = serializedBuffer.slice(8);
  return nmr;
}


module.exports = {
  generateStatListBuffer: generateStatListBuffer,
  generateStatReadBuffer: generateStatReadBuffer,
  generateLogClearBuffer: generateLogClearBuffer,
  generateLogLevelListBuffer: generateLogLevelListBuffer,
  generateLogListBuffer: generateLogListBuffer,
  generateLogModuleListBuffer: generateLogModuleListBuffer,
  generateLogShowBuffer: generateLogShowBuffer,
  generateEchoBuffer: generateEchoBuffer,
  imageUploadTransform: imageUploadTransform,
  generateImageTestBuffer: generateImageTestBuffer,
  generateImageConfirmBuffer: generateImageConfirmBuffer,
  generateImageListBuffer: generateImageListBuffer,
  generateImageCoreListBuffer: generateImageCoreListBuffer,
  generateResetBuffer: generateResetBuffer,
  decode: decode,
  _serialize: _serialize,
  _deserialize: _deserialize,
  _accumulate: _accumulate,
  _decode: _decode
};
