var socket;
var socketId;
var a;
var address = "127.0.0.1";
var final_count=0;
var upload_speed;
var str = "start";
// var port;
var chars = "0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ";
var count=0;
var rand = []
var avg_val = 1250
var div1,div2,div3,div4;
var packets_sent = 300;
var time_out_client = 10000;
var time_out_server = 17000;

//generates 300 random numbers averaging 1250

for(var i=0;i<150;i++){
	var cur_val = Math.floor(Math.random()*(1500 - 1000) + 1000)
	rand.push(cur_val);
    diff = cur_val - avg_val;
    new_val = avg_val - diff;
    rand.push(new_val);
}
//converts array buffer to string
function ab2str(buf) {
    return String.fromCharCode.apply(null, new Uint8Array(buf));
}
			
//recieves the udp sockets from the server

var onReceive = function(info) {
  if (info.socketId !== socketId)
    return;
  signal = ab2str(info.data)
  
  count++;
  //console.log(info.data);
  console.log(ab2str(info.data));
  console.log("recieved packets : "+count);
}
//converts string to array buffer and returns it
function str2ab(count) {
	var buf = new ArrayBuffer(rand[count]); 
	var bufView = new Uint8Array(buf);
	for (var i=0; i < rand[count] ;i++) {
      a = chars[Math.floor(Math.random()*62)]
	  bufView[i] = a.charCodeAt();
	}
	return buf;
}
//just a temporary function 
function str2ab1() {
	var buf = new ArrayBuffer(5); 
	var bufView = new Uint8Array(buf);
	for (var i=0; i < 5 ;i++) {
        bufView[i] = str.charCodeAt(i);
	}
	return buf;
}

//chrome api
chrome.sockets.udp.onReceive.addListener(onReceive);


//this function is called when send packets button is clicked

function openChannel() {
	load_img.style.visibility = 'visible';
	//send_btn.disabled = true;
    console.log("Opening channel: ");

    //change the socket connection for running local scripts
   socket = new WebSocket('ws://127.0.0.1:8888/bandwidth');
    //socket = new WebSocket('ws://ty1clickdash.cloudapp.net:7777/bandwidth');
    socket.binaryType = 'arraybuffer';
    socket.onopen = socketOpen;
    socket.onclose = socketClose;
    socket.onerror = socketError;
    socket.onmessage = socketRecv;
}

function socketPing(){
    var ping = JSON.stringify({"method": "PING"})
    socketSend(ping);
}

//request packets to server when socket opens
function socketOpen() {
    socket.active = 1;
    socket.send(JSON.stringify({"method": "INFO", "packets": packets_sent}));
	socket.send(JSON.stringify({"method": "REQ_PORT"}));
}

function socketError(err) {

    socket.active = 0;
    console.log("Error in Connecting")
}
//recieves messages from socket
function socketRecv(msg) {
    dat = JSON.parse(msg.data);
    if(dat.code == 200)
    	final_count = dat.info;
    else if(dat.code == 201)
    	var port = dat.port;
    else if(dat.code == 501){
    	console.log("firewall nat problem")
    	print_error_result("firewall nat problem");
    }
    else if(dat.code == 502){
    	console.log("server is busy")
    	print_error_result("firewall nat problem");
    }
    else if(dat.code == 203){
        server_packets_no  = dat.info; 
    	print_server_result(server_packets_no);
    }
    else if(dat.code == 400){
    	console.log("Bad Message");
    	print_error_result("firewall nat problem");
    }
  
    if(port){
		console.log("Port Number: ",port);
		sendPackets(port, dat.ip);
	}	
 }

//called when socket is called
function socketClose(msg) {
    socket.active = 0;
    console.log('web socket is closed'+msg);
    load_img.style.visibility = 'hidden';
}

//sending messages to socket
function socketSend(msg) {
    if(socket.active){
        console.log('Browser -> Server' + msg);
        socket.send(msg);        
    } else {
      console.log("connection lost");
    }
}


function print_error_result(msg){
	if(div3 = document.getElementById('div3'))
    	 div3.parentNode.removeChild(div3);

	div3 = document.createElement('p');
	div3.id = "div3";
	div3.innerHTML = msg;
	div3.style.cssText = 'font-size: x-large;';
	document.body.appendChild(div3);

}

function print_total_result_server(msg){
    if(div1 = document.getElementById('div1'))
    	 div1.parentNode.removeChild(div1);

	div2 = document.createElement('p');
	div2.id = "div1";
	div2.innerHTML = msg;
	div2.style.cssText = 'font-size: x-large;';
	document.body.appendChild(div2);
}

function print_total_result_client(msg){
    if(div2 = document.getElementById('div2'))
		 div2.parentNode.removeChild(div2);

	div2 = document.createElement('p');
	div2.id = "div2";
	div2.innerHTML = msg;
	div2.style.cssText = 'font-size: x-large;';
	document.body.appendChild(div2);
}


function print_client_result(){
	setTimeout(function(){
		msg = "Ratio of packets recieved by server" + final_count+"/"+packets_sent + " percentage of packets loss while uploading " + ((Math.round((100- (final_count/packets_sent)*100)*100))/100)+"%";
		console.log(msg);
		print_total_result_client(msg);
	}, time_out_client)
}

function print_server_result(server_packets_no){
	setTimeout(function(){
		msg = "Ratio of packets recieved by client" + count+"/"+server_packets_no + "  " +  " Percentage of packet loss while downloading: :"+ ((Math.round((100- (count/server_packets_no)*100)*100))/100)+"%";   
        console.log(msg);
        print_total_result_server(msg);
     	load_img.style.visibility = 'hidden';


	}, time_out_server);
}
function sendPackets(port, ip){
	console.log("Packets Sending Started");
	count = 0 ;

	//creation of websocket
	chrome.sockets.udp.create({}, function(socketInfo) {
    socketId = socketInfo.socketId;

	chrome.sockets.udp.bind( socketId, "0.0.0.0", 0, function (result) {	
  	var socketId = socketInfo.socketId;
  	//console.log("Socket Id : "+socketId);
	var i=0;
    
	/*for(var j = 0 ; j < 5; j++){
		try{
			chrome.sockets.udp.send(socketId,str2ab1(),ip,port,function(sendInfo){
	       		console.log("sending packets");
			})
			}
			catch(e){
				console.log("Error in sending ");
			}


	}
	*/	
	function myLoop(){
	 setTimeout(
	 	function(){
	 	chrome.sockets.udp.send(socketId, str2ab(i),
	    ip, port , function(sendInfo){
  	//              console.log(sendInfo.bytesSent);
            	
	    });
	    i++;
	    console.log(i);
	    if(i<packets_sent)
	    	myLoop();
	    else if(i === packets_sent){
	    	socket.send(JSON.stringify({"method": "SIZE", "body": "All packets are sent"}))
	    	print_client_result();
	    }
	 },
	 33)}   //sending a packet with 33 millisecond gap

	 myLoop();
 });

});

}


var send_btn = document.getElementById('send');

send_btn.addEventListener('click', openChannel);

var load_img = document.getElementById('loader');
