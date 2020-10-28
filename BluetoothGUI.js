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

let blueTooth;
let isConnected = false;


var millisecondTimerStart;
var oldColorPickerValue;

let DataRx = "";
let isDataReceived = false;
//let BtDataToJSON = "";

var NodeDataitems = [];
var SongDataitems = [];



console.log("setting up");
blueTooth = new p5ble();

function connectToBle() {
    // Connect to a device by passing the service UUID
    blueTooth.connect(serviceUuid, gotCharacteristics);
}

function DisconnectToBle() {
    // Connect to a device by passing the service UUID
    blueTooth.disconnect();
    // Check if myBLE is connected
    isConnected = blueTooth.isConnected();
    console.log('Device got disconnected?:');
    if (isConnected == false)
        console.log("Yes");
}


// A function that will be called once got characteristics
function gotCharacteristics(error, characteristics) {
    if (error) {
        console.log('error: ', error);
    }
    console.log('characteristics: ', characteristics);
    blueToothCharacteristic = characteristics[0];

    blueTooth.startNotifications(blueToothCharacteristic, gotValue, 'string');

    isConnected = blueTooth.isConnected();
    // Add a event handler when the device is disconnected
    //blueTooth.onDisconnected(onDisconnected);
    if (isConnected == true)
        sendData("{CMD_GET_TRACKS}&");
}


// A function that will be called once got values
function gotValue(value) {

    DataRx += value;
    //console.log("data rx:",DataRx);
    if (DataRx.indexOf(',&') > -1) {
        //isDataReceived = true;
        if (DataRx.indexOf('#,') > -1) { //Node Data Rx
            console.log("Node Data Received:");
            console.log(DataRx);
            console.log("Data Lenght:");
            console.log(DataRx.length);
            var TrimmedDataRx = DataRx.substring(2, ((DataRx.length) - 3));
            console.log(TrimmedDataRx);
            //ParserBtData();
           

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
            var rgb = "rgb(" + convert_rgb.r + "," + convert_rgb.g + "," + convert_rgb.b + ")"; // rgb(7,101,145)

            var red = convert_rgb.r; // 7
            var green = convert_rgb.g; // 101
            var blue = convert_rgb.b; // 145

            $("#Color").css("background-color", rgb);
            document.getElementsByClassName("switch").value = NodeDataitems[4].Data;

        }
        else if (DataRx.indexOf('@,') > -1) { //Song list Rx
            console.log("Song List Received:");
            console.log(DataRx);
            console.log("Data Lenght:");
            console.log(DataRx.length);
            var TrimmedDataRx = DataRx.substring(2, ((DataRx.length) - 2));
            console.log(TrimmedDataRx);
           // DataRx = '';

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
                SongList.options[i ] = new Option(SongDataitems[i-1].Data, SongDataitems[i-1].Data);
            }
        }
        DataRx = '';
    }
}

function onDisconnected() {

    isConnected = false;
}

function sendData(command) {
    const inputValue = command;
    if (!("TextEncoder" in window)) {
        console.log("Sorry, this browser does not support TextEncoder...");
    }
    var enc = new TextEncoder(); // always utf-8
    blueToothCharacteristic.writeValue(enc.encode(inputValue));
    console.log("Sended Data");
}

function ParserBtData() {

    // if (isDataReceived == true) {
    // isDataReceived = false;
    console.log("Data Received:");
    console.log(DataRx);
    var DataRxLenght = DataRx.length;
    console.log("Data Lenght:");
    console.log(DataRxLength);
    //Remove START_FRAME and END_FRAME character
    var TrimmedDataRx = DataRx.substring(2, ((DataRx.length) - 3));
    //console.log(DataRx);
    console.log(TrimmedDataRx);
    // // Converted into JSON:
    // //BtDataToJSON = JSON.stringify(TrimmedDataRx);
    // BtDataToJSON = JSON.parse(TrimmedDataRx);
    // //console.log("Lenght Data Rx: ");
    // //console.log(BtDataToJSON.Nodos[0].TrackName);

    // var NodeDataArray = TrimmedDataRx.split(",");

    // var item, items = [];
    // for (var i = 0; i < NodeDataArray.length; i++) {
    //     item = {};
    //     item.Data = NodeDataArray[i];
    //     items.push(item);
    // }

    // var main = $("<ul>");
    // var str = "";

    // str += "<li> NodeNumber:" + items[0].Data + "</li><ul><li>Color: <b>" + items[1].Data + "</b></li>";
    // str += "<li>Track Name: <b>" + items[2].id + "</b></li></ul>";

    // main.html(str);
    // $(document.body).append("<h3>items</h3>")
    // $(document.body).append(main);
    // //}
}

function HEXtoRGB(hex) {
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
        return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}