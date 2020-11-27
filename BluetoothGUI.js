/*  
 * Bluetooth Test - Processing Side (In Chrome)
 * Arduino to HM10 module to Google Chrome
 * https://www.amazon.com/gp/product/B06WGZB2N4/ref=ppx_yo_dt_b_asin_title_o01_s00?ie=UTF8&psc=1
 * 
 * p5.ble.js
 https://yining1023.github.io/p5ble-website/
 
 * kevin darrah
 * 
 * Twitter: https://twitter.com/KDcircuits
 * For inquiries or design services:
 * https://www.kdcircuits.com
 * 
 * License?  Do whatever you want with this code - it's just a sample
 */

//globals
const serviceUuid = "0000ffe0-0000-1000-8000-00805f9b34fb";
let blueToothCharacteristic; //this is a blu
let receivedValue = "";
let byteLength = 20;

let blueTooth;
let isConnected = false;


var millisecondTimerStart;


let DataRx = "";
let isNodeDataReceived = false;
var NodeDataitems = [];
var SongDataitems = [];
let receivedString = "";


//Data Frame Items to Send to device via BT
var NodeNumber = -1;
var NewColorPickedValue = "";
var NewShakeValue = "";
var NewTrackNameValue = "";

var NOT_SHAKE = "2";
var SHAKE = "3";

console.log("setting up");

// Кэш объекта выбранного устройства
let deviceCache = null;

// Кэш объекта характеристики
let characteristicCache = null;

// Промежуточный буфер для входящих данных
let readBuffer = '';

// Запустить выбор Bluetooth устройства и подключиться к выбранному
function connect() {
  return (deviceCache ? Promise.resolve(deviceCache) :
    requestBluetoothDevice()).
    then(device => connectDeviceAndCacheCharacteristic(device)).
    then(characteristic => startNotifications(characteristic, 'string')).
    catch(error => console.log(error));
}

// Запрос выбора Bluetooth устройства
function requestBluetoothDevice() {
  console.log('Requesting bluetooth device...');

  return navigator.bluetooth.requestDevice({
    filters: [{ services: [0xFFE0] }],
  }).
    then(device => {
      console.log('"' + device.name + '" bluetooth device selected');
      deviceCache = device;
      deviceCache.addEventListener('gattserverdisconnected',
        handleDisconnection);

      return deviceCache;
    });
}

// Обработчик разъединения
function handleDisconnection(event) {
  let device = event.target;

  console.log('"' + device.name +
    '" bluetooth device disconnected, trying to reconnect...');

  connectDeviceAndCacheCharacteristic(device).
    then(characteristic => startNotifications(characteristic)).
    catch(error => console.log(error));
}

// Подключение к определенному устройству, получение сервиса и характеристики
function connectDeviceAndCacheCharacteristic(device) {
  if (device.gatt.connected && characteristicCache) {
    return Promise.resolve(characteristicCache);
  }

  console.log('Connecting to GATT server...');

  return device.gatt.connect().
    then(server => {
      console.log('GATT server connected, getting service...');

      return server.getPrimaryService(0xFFE0);
    }).
    then(service => {
      console.log('Service found, getting characteristic...');

      return service.getCharacteristic(0xFFE1);
    }).
    then(characteristic => {
      console.log('Characteristic found');
      characteristicCache = characteristic;

      return characteristicCache;
    });
}

// Включение получения уведомлений об изменении характеристики
function startNotifications(characteristic) {
  console.log('Starting notifications...');

  return characteristic.startNotifications().
    then(() => {
      console.log('Notifications started');
      characteristic.addEventListener('characteristicvaluechanged',
        handleCharacteristicValueChanged);
      send("{CMD_GET_TRACKS}&");
      isConnected = true;
      $("#Head").css("color", "rgb(0, 0, 255)");
    });


}

// Получение данных
function handleCharacteristicValueChanged(event) {


  let value = new TextDecoder().decode(event.target.value);

  //for (var i = 0; i < event.target.value.byteLength; i++) {
  //receivedString = receivedString + String.fromCharCode(event.target.value.getUint8(i));
  receivedString += value;
  //}

  if (receivedString.search(",&") > -1) {

    if (receivedString.search('#,') > -1) { //Node Data Rx
      isNodeDataReceived = true;
      console.log("Node Data Received:");
      console.log(receivedString);
      console.log("Data Lenght:");
      console.log(receivedString.length);
      var TrimmedDataRx = receivedString.substring(2, ((receivedString.length) - 3));
      console.log(TrimmedDataRx);
      var NodeDataArray = TrimmedDataRx.split(",");
      var item;

      for (var i = 0; i < NodeDataArray.length; i++) {
        item = {};
        item.Data = NodeDataArray[i];
        NodeDataitems.push(item);
      }
      console.log(NodeDataitems);

      var color = NodeDataitems[1].Data; //#8ADAFF

      var convert_rgb = HEXtoRGB(color); // {"r":7,"g":101,"b":145}
      var rgb = "rgb(" + convert_rgb.rChannel + "," + convert_rgb.gChannel + "," + convert_rgb.bChannel + ")"; // rgb(7,101,145)

      var red = convert_rgb.rChannel; // 7
      var green = convert_rgb.gChannel; // 101
      var blue = convert_rgb.bChannel; // 145

      $("#Color").css("background-color", rgb);
      document.getElementById('ActualTrackName').value = NodeDataitems[2].Data;
      console.log(NodeDataitems[3].Data);

      if (NodeDataitems[3].Data == SHAKE) {
        document.getElementById("ActualShakeConfig").value = "Si";
        document.getElementById("SetShakeConfig").value = "Desactiva";
      }
      else if (NodeDataitems[3].Data == NOT_SHAKE) {
        document.getElementById("ActualShakeConfig").value = "No";
        document.getElementById("SetShakeConfig").value = "Activa";
      }

    }
    else if (receivedString.search('@,') > -1) { //Song list Rx
      console.log("Song List Received:");
      console.log(receivedString);
      console.log("Data Lenght:");
      console.log(receivedString.length);
      var TrimmedDataRx = receivedString.substring(2, ((receivedString.length) - 2));
      console.log(TrimmedDataRx);
      // receivedString = '';

      var SongListDataArray = TrimmedDataRx.split(",");
      var item;

      for (var i = 1; i < SongListDataArray.length; i++) {
        item = {};
        item.Data = SongListDataArray[i];
        SongDataitems.push(item);
      }
      console.log(SongDataitems);

      var SongList = document.getElementById('SongList');
      SongList.options[0] = new Option('--Disponibles--', '');
      for (var i = 1; i < SongListDataArray.length; i++) {
        SongList.options[i] = new Option(SongDataitems[i - 1].Data, SongDataitems[i - 1].Data);
      }
    }
    receivedString = "";
    TrimmedDataRx = "";
    SongDataitems = [];
    NodeDataitems = [];
  }
}

// Записать значение в характеристику
function writeToCharacteristic(characteristic, data) {
  characteristic.writeValue(new TextEncoder().encode(data));
}

// Отключиться от подключенного устройства
function disconnect() {
  if (deviceCache) {
    console.log('Disconnecting from "' + deviceCache.name + '" bluetooth device...');
    deviceCache.removeEventListener('gattserverdisconnected',
      handleDisconnection);

    if (deviceCache.gatt.connected) {
      deviceCache.gatt.disconnect();
      console.log('"' + deviceCache.name + '" bluetooth device disconnected');
    }
    else {
      console.log('"' + deviceCache.name +
        '" bluetooth device is already disconnected');
    }
  }

  if (characteristicCache) {
    characteristicCache.removeEventListener('characteristicvaluechanged',
      handleCharacteristicValueChanged);
    characteristicCache = null;
  }

  deviceCache = null;
  $("#Head").css("color", "rgb(255, 0, 0)");
}

function send(data) {
  data = String(data);

  console.log(data);

  if (!data || !characteristicCache) {
    return;
  }

  data += '\n';

  if (data.length > 20) {
    let chunks = data.match(/(.|[\r\n]){1,20}/g);

    writeToCharacteristic(characteristicCache, chunks[0]);

    for (let i = 1; i < chunks.length; i++) {
      setTimeout(() => {
        writeToCharacteristic(characteristicCache, chunks[i]);
      }, i * 100);
    }
  }
  else {
    writeToCharacteristic(characteristicCache, data);
  }

  console.log(data);
}

function HEXtoRGB(color) {

  var rgbColor = {};
  /* Grab each pair (channel) of hex values and parse them to ints using hexadecimal decoding */
  rgbColor.rChannel = parseInt(color.substring(0, 2), 16);
  rgbColor.gChannel = parseInt(color.substring(2, 4), 16);
  rgbColor.bChannel = parseInt(color.substring(4), 16);

  return rgbColor;
}

function connectToBle() {
  connect();
}

function DisconnectToBle() {
  disconnect();
}

function GetDataNodes(Node_id) {

  var x = document.getElementById("NodeData");
  var y = document.getElementById("Main");

  console.log("Node:", Node_id)

  if (isConnected == true) { //FIXME replace if-else sentence by switch-case
    console.log("Sending Cmd Gat Data")
    if (Node_id == "Node_1") {
      //send("{CMD_GET_DATA:1}&");
      NodeNumber = 0;
      send("{CMD_GET_DATA:1}&");
    }
    else if (Node_id == "Node_2") {
      NodeNumber = 1;
      send("{CMD_GET_DATA:2}&");
    }
    else if (Node_id == "Node_3") {
      NodeNumber = 2;
      send("{CMD_GET_DATA:3}&");
    }
    else if (Node_id == "Node_4") {
      NodeNumber = 3;
      send("{CMD_GET_DATA:4}&");
    }
    else if (Node_id == "Node_5") {
      NodeNumber = 4;
      send("{CMD_GET_DATA:5}&");
    }
    else if (Node_id == "Node_6") {
      NodeNumber = 5;
      send("{CMD_GET_DATA:6}&");
    }

    //while (isNodeDataReceived);
    //isNodeDataReceived = false;
    console.log("Data Rx")
    if (x.style.display === 'block') {
      x.style.display = 'none';
      y.style.display = 'block'
    } else {
      y.style.display = 'none';
      x.style.display = 'block';
    }

  }
}

function onDisconnected() {
  isConnected = false;
}

function ToggleForm() {
  var x = document.getElementById("NodeData");
  var y = document.getElementById("Main");
  if (x.style.display === 'block') {
    x.style.display = 'none';
    y.style.display = 'block';
  } else {
    y.style.display = 'none';
    x.style.display = 'block';
  }
}

function IgnoreConfig() {
  NewColorPickedValue = "";
  NewTrackNameValue = "";
  NewShakeValue = "";
  ToggleForm();
}

function SetColor(ColorName_id) {

  console.log(ColorName_id);

  switch (ColorName_id) {

    case "ColorName_1":
      NewColorPickedValue = "FF0000";
      break;
    case "ColorName_2":
      NewColorPickedValue = "008000";
      break;
    case "ColorName_3":
      NewColorPickedValue = "0000FF";
      break;
    case "ColorName_4":
      NewColorPickedValue = "FFFF00";
      break;
    case "ColorName_5":
      NewColorPickedValue = "808080";
      break;
    case "ColorName_6":
      NewColorPickedValue = "A52A2A";
      break;
    case "ColorName_7":
      NewColorPickedValue = "FFA500";
      break;
    case "ColorName_8":
      NewColorPickedValue = "800080";
      break;
    default:
      NewColorPickedValue = "000000";
      break;
  }

  console.log(NewColorPickedValue);

  var convert_rgb = HEXtoRGB(NewColorPickedValue); // {"r":7,"g":101,"b":145}
  var rgb = "rgb(" + convert_rgb.rChannel + "," + convert_rgb.gChannel + "," + convert_rgb.bChannel + ")"; // rgb(7,101,145)
  $("#Color").css("background-color", rgb);

}

function GetSelecteSongName() {

  var SongList = document.getElementById('SongList');
  var opt;
  var len;
  for (var i = 0, len = SongList.options.length; i < len; i++) {
    opt = SongList.options[i];
    if (opt.selected === true) {
      break;
    }
  }
  console.log(opt.value);
  document.getElementById('ActualTrackName').value = opt.value;
  NewTrackNameValue = opt.value;
}

function SetShakeConfig() {

  if (document.getElementById("ActualShakeConfig").value == "Si") {
    document.getElementById("ActualShakeConfig").value = "No";
    document.getElementById("SetShakeConfig").value = "Activar"
    NewShakeValue = NOT_SHAKE;
  }
  else if (document.getElementById("ActualShakeConfig").value == "No") {
    document.getElementById("ActualShakeConfig").value = "Si";
    document.getElementById("SetShakeConfig").value = "Desactivar"
    NewShakeValue = SHAKE;
  }

}

function SendConfigToDevice() {

  send("{CMD_SET_CONF:" + NodeNumber + "," + NewColorPickedValue
    + "," + NewTrackNameValue + "," + NewShakeValue + "}&");
}

