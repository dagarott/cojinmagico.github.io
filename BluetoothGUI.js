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
//const serviceUuid = "0000ffe0-0000-1000-8000-00805f9b34fb";
const SERVICE_UUID = "d5875408-fa51-4763-a75d-7d33cecebc31";
const CHARACTERISTIC_UUID = "a4f01d8c-a037-43b6-9050-1876a8c23584";
//const TX_CHARACTERISTIC_UUID = "a4f01d8c-a037-43b6-9050-1876a8c23584";

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

var ColorDict = {

  Black: "0x000000",
  Blue: "0x0000FF",
  Brown: "0xA52A2A",
  Cyan: "0x00FFFF",
  Gray: "0x808080",
  Grey: "0x808080",
  Green: "0x008000",
  Magenta: "0xFF00FF",
  Orange: "0xFFA500",
  Pink: "0xFFC0CB",
  Purple: "0x800080",
  Red: "0xFF0000",
  Silver: "0xC0C0C0",
  Violet: "0xEE82EE",
  White: "0xFFFFFF",
  Yellow: "0xFFFF00"
};

console.log("setting up");

// Кэш объекта выбранного устройства
let deviceCache = null;

// Кэш объекта характеристики
let characteristicCache = null;

// Промежуточный буфер для входящих данных
let readBuffer = '';


// Initialize new SpeechSynthesisUtterance object
let speech = new SpeechSynthesisUtterance();
// Set Speech Language
speech.lang = "es-ES";


//Initial Config Value:
var NodeConfig = {
  Color: "0x0000FF",
  ShakeMode: "TRUE",
  BuzzerMode: "TRUE",
  Sentence: "Hola Mundo"
};

function InitLocalStorage() {

  var CheckStatusLocalStorage;
  CheckStatusLocalStorage = localStorage.getItem('Initialized');

  if (!CheckStatusLocalStorage) {

    localStorage.setItem('Initialized', true);
    for (var idx = 0; idx < 6; idx++) {
      localStorage.setItem('NodeConfig_' + idx, JSON.stringify(NodeConfig));
    }

  }

}
function SaveConfig(NodeNumber) {
  //var lscount = localStorage.length; //Get the Length of the LocalStorage
  //for (var idx = 0; idx < 6; idx++) {
  NodeConfig.Sentence = document.getElementById("ActualSentence").value;
  console.log("Saving Data");
  console.log(NodeConfig.Color);
  console.log(NodeConfig.BuzzerMode);
  console.log(NodeConfig.ShakeMode);
  console.log(NodeConfig.Sentence);
  localStorage.setItem('NodeConfig_' + NodeNumber, JSON.stringify(NodeConfig));
  //var obj2 = JSON.parse(localStorage.getItem('NodeConfig_' + lscount));
  //console.log(obj2.Color);
  //console.log(obj2.Sentence);
  //}
  ToggleForm();
}

function GetConfig(NodeNumber) {
  var NodeConfigValues = JSON.parse(localStorage.getItem('NodeConfig_' + NodeNumber));
  //console.log(NodeConfigValues.Color);
  //console.log(NodeConfigValues.Sentence);
  return NodeConfigValues;
}


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
    filters: [{ name: ['ESP32 UART Test'] }],
    //optionalServices:[SERVICE_UUID],
    optionalServices: [SERVICE_UUID],
    //acceptAllDevices: true
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
  //SaveConfig();
  console.log('Connecting to GATT server...');

  return device.gatt.connect().
    then(server => {
      console.log('GATT server connected, getting service...');

      return server.getPrimaryService(SERVICE_UUID);
    }).
    then(service => {
      console.log('Service found, getting characteristic...');

      return service.getCharacteristic(CHARACTERISTIC_UUID);
      // return Promise.all([
      //   service.getCharacteristic(RX_CHARACTERISTIC_UUID),
      //   service.getCharacteristic(TX_CHARACTERISTIC_UUID)
      // ]);
    }).
    then(characteristic => {
      console.log('Characteristic found');
      characteristicCache = characteristic;

      return characteristicCache;
    });
}


function startNotifications(characteristic) {
  console.log('Starting notifications...');

  return characteristic.startNotifications().
    then(() => {
      console.log('Notifications started');
      characteristic.addEventListener('characteristicvaluechanged',
        handleCharacteristicValueChanged);
      isConnected = true;
      $("#Head").css("color", "rgb(0, 0, 255)");
    });
}


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
      console.log(NodeDataitems[0].Data);
      console.log(NodeDataitems[1].Data);
      console.log(NodeDataitems[2].Data);

      if (NodeDataitems[0].Data == "COJIN_MAGICO") {
        if (NodeDataitems[1].Data == "SENSOR_STATUS") {
          if ((NodeDataitems[2].Data == "SENSOR_NUM_0") ||
            (NodeDataitems[2].Data == "SENSOR_NUM_1") ||
            (NodeDataitems[2].Data == "SENSOR_NUM_2") ||
            (NodeDataitems[2].Data == "SENSOR_NUM_3") ||
            (NodeDataitems[2].Data == "SENSOR_NUM_4")) {
            (NodeDataitems[2].Data == "SENSOR_NUM_5")

            console.log("Sensor:");
            console.log(NodeDataitems[2].Data);
            console.log("pressed");
            ToggleHandIcon(NodeDataitems[2].Data);

            switch (NodeDataitems[2].Data) {
              case "SENSOR_NUM_0":
                NumNode = 0;
                break;
              case "SENSOR_NUM_1":
                NumNode = 1;
                break;
              case "SENSOR_NUM_2":
                NumNode = 2;
                break;
              case "SENSOR_NUM_3":
                NumNode = 3;
                break;
              case "SENSOR_NUM_4":
                NumNode = 4;
                break;
              case "SENSOR_NUM_5":
                NumNode = 5;
                break;
              default:
                console.log("Error Num Sensor");
                break;
            }

            var NodeConfigRead = GetConfig(NumNode);

            speech.text = NodeConfigRead.Sentence;
            console.log(speech.text);
            speechSynthesis.speak(speech);
            SendConfigToDevice(NodeDataitems[2].Data)
          }
        }
      }
    }
    receivedString = "";
    TrimmedDataRx = "";
    //SongDataitems = [];
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

function BtTransmit(data) {
  data = String(data);

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

function HEXtoRGB(Hexcolor) {

  var rgbColor = {};
  /* Grab each pair (channel) of hex values and parse them to ints using hexadecimal decoding */
  var color = Hexcolor.substring(2, 8);
  rgbColor.rChannel = parseInt(color.substring(0, 2), 16);
  rgbColor.gChannel = parseInt(color.substring(2, 4), 16);
  rgbColor.bChannel = parseInt(color.substring(4), 16);

  return rgbColor;
}

function ConnectToBle() {
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
    //console.log("Sending Cmd Gat Data")
    if (Node_id == "Node_1") {
      NodeNumber = 0;
    }
    else if (Node_id == "Node_2") {
      NodeNumber = 1;
    }
    else if (Node_id == "Node_3") {
      NodeNumber = 2;
    }
    else if (Node_id == "Node_4") {
      NodeNumber = 3;
    }
    else if (Node_id == "Node_5") {
      NodeNumber = 4;
    }
    else if (Node_id == "Node_6") {
      NodeNumber = 5;
    }

    var NodeConfigRead = GetConfig(NodeNumber);
    var convert_rgb = HEXtoRGB(NodeConfigRead.Color); // {"r":7,"g":101,"b":145}
    var rgb = "rgb(" + convert_rgb.rChannel + "," + convert_rgb.gChannel + "," + convert_rgb.bChannel + ")"; // rgb(7,101,145)

    var red = convert_rgb.rChannel; // 7
    var green = convert_rgb.gChannel; // 101
    var blue = convert_rgb.bChannel; // 145

    $("#Color").css("background-color", rgb);

    if (NodeConfigRead.ShakeMode == "TRUE") {
     
      document.getElementById("ActualShakeConfig").value = "SI";
      document.getElementById("SetShakeConfig").value = "Desactiva";
    }
    else if (NodeConfigRead.ShakeMode == "FALSE") {
     
      document.getElementById("ActualShakeConfig").value = "NO";
      document.getElementById("SetShakeConfig").value = "Activa";
    }

    document.getElementById("ActualSentence").value = NodeConfigRead.Sentence;

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

  switch (ColorName_id) {

    case "ColorName_1":
      NodeConfig.Color = ColorDict.Red;
      break;
    case "ColorName_2":
      NodeConfig.Color = ColorDict.Green;
      break;
    case "ColorName_3":
      NodeConfig.Color = ColorDict.Blue;
      break;
    case "ColorName_4":
      NodeConfig.Color = ColorDict.Yellow;
      break;
    case "ColorName_5":
      NodeConfig.Color = ColorDict.Grey;
      break;
    case "ColorName_6":
      NodeConfig.Color = ColorDict.Brown;
      break;
    case "ColorName_7":
      NodeConfig.Color = ColorDict.Orange;
      break;
    case "ColorName_8":
      NodeConfig.Color = ColorDict.Purple;
      break;
    default:
      NodeConfig.Color = 0x000000;
      break;
  }

  var convert_rgb = HEXtoRGB(NodeConfig.Color); // {"r":7,"g":101,"b":145}
  var rgb = "rgb(" + convert_rgb.rChannel + "," + convert_rgb.gChannel + "," + convert_rgb.bChannel + ")"; // rgb(7,101,145)
  $("#Color").css("background-color", rgb);
  /*  console.log("Node Number");
   console.log(NodeNumber);
   console.log("Color");
   console.log(NodeConfig.Color); */
  //SaveConfig(NodeNumber);
}

/* function GetSelecteSongName() {

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
  console.log(NewTrackNameValue);

} */

function SetShakeConfig() {

  if (document.getElementById("ActualShakeConfig").value == "SI") {
    document.getElementById("ActualShakeConfig").value = "NO";
    document.getElementById("SetShakeConfig").value = "Activar"
    NodeConfig.ShakeMode = "FALSE";
  }
  else if (document.getElementById("ActualShakeConfig").value == "NO") {
    document.getElementById("ActualShakeConfig").value = "SI";
    document.getElementById("SetShakeConfig").value = "Desactivar"
    NodeConfig.ShakeMode = "TRUE";
  }

  console.log("Node Number");
  console.log(NodeNumber);
  console.log("Shake Mode");
  console.log(NodeConfig.ShakeMode);
  //SaveConfig(NodeNumber);
}

async function SendConfigToDevice(NodeNumber) {

  var NumNode;
  switch (NodeNumber) {
    case "SENSOR_NUM_0":
      NumNode = 0;
      break;
    case "SENSOR_NUM_1":
      NumNode = 1;
      break;
    case "SENSOR_NUM_2":
      NumNode = 2;
      break;
    case "SENSOR_NUM_3":
      NumNode = 3;
      break;
    case "SENSOR_NUM_4":
      NumNode = 4;
      break;
    case "SENSOR_NUM_5":
      NumNode = 5;
      break;
    default:
      console.log("Error Num Sensor");
      break;
  }

  var NodeConfigRead = GetConfig(NumNode);
  console.log(NodeConfigRead.color);
  BtTransmit("#,CELL_PHONE,SET_COLOR," + NodeConfigRead.Color
    + "," + "0" + ",&");
  await sleep(500);
  BtTransmit("#,CELL_PHONE,RUN_BUZZER," + NodeConfig.BuzzerMode
    + "," + "0" + ",&");
  await sleep(500);
  BtTransmit("#,CELL_PHONE,RUN_MOTOR," + NodeConfig.ShakeMode
    + "," + "0" + ",&");
}

function ConnectDisconectToBle() {

  var imag = document.getElementById('DisConBTDevice')

  if (imag.src.match('assets/BTdisconnect.png')) {
    imag.src = "assets/BTconnect.png";
    ConnectToBle();
  }
  else {
    imag.src = "assets/BTdisconnect.png";
    DisconnectToBle();
  }
}

function TestSentence() {

  speech.text = document.getElementById("ActualSentence").value;
  console.log(speech.text);
  speechSynthesis.speak(speech);

}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ToggleHandIcon(NumNode) {
  switch (NumNode) {
    case "SENSOR_NUM_0":
      document.getElementById('Sensor1Status').src = "assets/Hand-Touch-2-icon.png";
      await sleep(1000);
      document.getElementById('Sensor1Status').src = "assets/One-Finger-icon.png";
      break;
    case "SENSOR_NUM_1":
      document.getElementById('Sensor2Status').src = "assets/Hand-Touch-2-icon.png";
      await sleep(1000);
      document.getElementById('Sensor2Status').src = "assets/One-Finger-icon.png";
      break;
    case "SENSOR_NUM_2":
      document.getElementById('Sensor3Status').src = "assets/Hand-Touch-2-icon.png";
      await sleep(1000);
      document.getElementById('Sensor3Status').src = "assets/One-Finger-icon.png";
      break;
    case "SENSOR_NUM_3":
      document.getElementById('Sensor4Status').src = "assets/Hand-Touch-2-icon.png";
      await sleep(1000);
      document.getElementById('Sensor4Status').src = "assets/One-Finger-icon.png";
      break;
    case "SENSOR_NUM_4":
      document.getElementById('Sensor5Status').src = "assets/Hand-Touch-2-icon.png";
      await sleep(1000);
      document.getElementById('Sensor5Status').src = "assets/One-Finger-icon.png";
      break;
    case "SENSOR_NUM_5":
      document.getElementById('Sensor6Status').src = "assets/Hand-Touch-2-icon.png";
      await sleep(1000);
      document.getElementById('Sensor6Status').src = "assets/One-Finger-icon.png";
      break;
    default:
      console.log("Error Num Sensor");
      break;
  }
}