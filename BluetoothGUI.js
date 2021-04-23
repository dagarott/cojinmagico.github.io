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
  ShakeMode: true,
  BuzzerMode: true,
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
function SaveConfig() {
  var lscount = localStorage.length; //Get the Length of the LocalStorage

  for (var idx = 0; idx < 6; idx++) {
    localStorage.setItem('NodeConfig_' + idx, JSON.stringify(NodeConfig));
    //var obj2 = JSON.parse(localStorage.getItem('NodeConfig_' + lscount));
    //console.log(obj2.Color);
    //console.log(obj2.Sentence);
  }

}

function Getconfig(NodeNumber) {
  var NodeConfigValues = JSON.parse(localStorage.getItem('NodeConfig_' + NodeNumber));
  console.log(NodeConfigValues.Color);
  console.log(NodeConfigValues.Sentence);
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
  SaveConfig();
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

      if ((NodeDataitems[0].Data == "COJIN_MAGICO") &&
        (NodeDataitems[1].Data == "SENSOR_STATUS") &&
        (NodeDataitems[2].Data == "SENSOR_NUM_0")) {
        //document.getElementById('Sensor1Status').src = "assets/Hand-Touch-2-icon.png";
        console.log("Sensor 1 Pressed");
        ToggleHandIcon();
      }
    }
  }
  receivedString = "";
  TrimmedDataRx = "";
  //SongDataitems = [];
  NodeDataitems = [];
  item

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

      var NodeConfigRead = Getconfig(0);
      var convert_rgb = HEXtoRGB(NodeConfigRead.Color); // {"r":7,"g":101,"b":145}
      var rgb = "rgb(" + convert_rgb.rChannel + "," + convert_rgb.gChannel + "," + convert_rgb.bChannel + ")"; // rgb(7,101,145)

      var red = convert_rgb.rChannel; // 7
      var green = convert_rgb.gChannel; // 101
      var blue = convert_rgb.bChannel; // 145

      $("#Color").css("background-color", rgb);
      //speech.text = NodeConfigRead.Sentence;
      //console.log(localStorage.getItem('Sentence'));
      //speechSynthesis.speak(speech);
      //document.getElementById('Sensor1Status').src = "assets/One-Finger-icon.png";

      if (NodeConfigRead.ShakeMode == true) {
        NewShakeValue = SHAKE;
        document.getElementById("ActualShakeConfig").value = "Si";
        document.getElementById("SetShakeConfig").value = "Desactiva";
      }
      else if (NodeConfigRead.ShakeMode == false) {
        NewShakeValue = NOT_SHAKE;
        document.getElementById("ActualShakeConfig").value = "No";
        document.getElementById("SetShakeConfig").value = "Activa";
      }

      document.getElementById("ActualSentence").value = NodeConfigRead.Sentence;
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

  //console.log(ColorName_id);

  switch (ColorName_id) {

    case "ColorName_1":
      NewColorPickedValue = ColorDict.Red;
      break;
    case "ColorName_2":
      NewColorPickedValue = ColorDict.Green;
      break;
    case "ColorName_3":
      NewColorPickedValue = ColorDict.Blue;
      break;
    case "ColorName_4":
      NewColorPickedValue = ColorDict.Yellow;
      break;
    case "ColorName_5":
      NewColorPickedValue = ColorDict.Grey;
      break;
    case "ColorName_6":
      NewColorPickedValue = ColorDict.Brown;
      break;
    case "ColorName_7":
      NewColorPickedValue = ColorDict.Orange;
      break;
    case "ColorName_8":
      NewColorPickedValue = ColorDict.Purple;
      break;
    default:
      NewColorPickedValue = 0x000000;
      break;
  }
  //Parse String Color Name to Hex Color value
  //var color = ColorDict[NewColorPickedValue];

  //console.log(color);
  console.log(NewColorPickedValue);

  var convert_rgb = HEXtoRGB(NewColorPickedValue); // {"r":7,"g":101,"b":145}
  var rgb = "rgb(" + convert_rgb.rChannel + "," + convert_rgb.gChannel + "," + convert_rgb.bChannel + ")"; // rgb(7,101,145)
  $("#Color").css("background-color", rgb);

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

  // send("{CMD_SET_CONF:" + NodeNumber + "," + NewColorPickedValue
  //   + "," + NewTrackNameValue + "," + NewShakeValue + "}&");

  ToggleForm();
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

async function ToggleHandIcon() {
  document.getElementById('Sensor1Status').src = "assets/Hand-Touch-2-icon.png";
  await sleep(1000);
  document.getElementById('Sensor1Status').src = "assets/One-Finger-icon.png";
}