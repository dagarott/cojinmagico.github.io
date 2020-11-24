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
var oldColorPickerValue;

let DataRx = "";
let isNodeDataReceived = false;
var NodeDataitems = [];
var SongDataitems = [];
let receivedString = "";
//var receivedData = '';

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
      console.log("Color Data:");
      console.log(color);
      console.log("Color Data Lenght:");
      console.log(color.length);

      console.log("RGB Values:");


     // var convert_rgb = HEXtoRGB(color); // {"r":7,"g":101,"b":145}
      //var rgb = "rgb(" + convert_rgb.red + "," + convert_rgb.green + "," + convert_rgb.blue + ")"; // rgb(7,101,145)

      // var red = convert_rgb.red; // 7
      // var green = convert_rgb.green; // 101
      // var blue = convert_rgb.blue; // 145
     


     // $("#Color").css("background-color", rgb);
      document.getElementById('ActualTrackName').value = NodeDataitems[2].Data;
      document.getElementsByClassName("switch").value = NodeDataitems[4].Data;

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
      SongList.options[0] = new Option('--Selecciona--', '');
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

// Отправить данные подключенному устройству
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


function HEXtoRGB(hexColor) {

  // var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  // hex = hex.replace(shorthandRegex, function (m, r, g, b) {
  //   return r + r + g + g + b + b;
  // });
  // var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  // return result ? {
  //   r: parseInt(result[1], 16),
  //   g: parseInt(result[2], 16),
  //   b: parseInt(result[3], 16)
  // } : null;

}

function connectToBle() {
  // Connect to a device by passing the service UUID
  //blueTooth.connect(serviceUuid, gotCharacteristics);
  connect();
}

function DisconnectToBle() {
  // Connect to a device by passing the service UUID
  //blueTooth.disconnect();
  // Check if myBLE is connected
  //isConnected = blueTooth.isConnected();
  //console.log('Device got disconnected?:');
  //if (isConnected == false)
  //  console.log("Yes");
  disconnect();
}

function GetDataNodes(Node_id) {

  var x = document.getElementById("NodeData");
  var y = document.getElementById("Main");

  console.log("Node:", Node_id)

  if (isConnected == true) {
    console.log("Sending Cmd Gat Data")
    if (Node_id == "Node_1") {
      //send("{CMD_GET_DATA:1}&");
      send("{CMD_GET_DATA:1}&");
    }
    else if (Node_id == "Node_2") {
      send("{CMD_GET_DATA:2}&");
    }
    else if (Node_id == "Node_3") {
      send("{CMD_GET_DATA:3}&");
    }
    else if (Node_id == "Node_4") {
      send("{CMD_GET_DATA:4}&");
    }
    else if (Node_id == "Node_5") {
      send("{CMD_GET_DATA:5}&");
    }
    else if (Node_id == "Node_6") {
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

function SetColor()
{
  
}