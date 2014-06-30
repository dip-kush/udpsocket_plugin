import websocket
import thread
import time
import json
import socket


def on_message(ws, message):
    msg = json.loads(message)
    print "recieved from server: ",msg
    if  msg['code'] == 201:
        send_packets(msg['port'], msg['ip'], ws)
        print msg['port'], msg['ip']
   

def on_error(ws, error):
    print error

def on_close(ws):
    print "### closed ###"


def send_packets(port, ip, ws):
    udp_ip = ip
    udp_port = port 
    count = 0
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(20.0)
    #sock.bind((udp_ip, udp_port))
    for i in range(300):
        try:  
            sock.sendto("hello", (udp_ip, udp_port))
        except socket.timeout:
            print "connection timed out while sending"
            break
    #while True:
    for j in range(300):
        try:
            data, addr = sock.recvfrom(12500)
            count+=1
            print 'recieved',count
            #print data
        except socket.timeout:
            print "connection timed out while recieving"
            #ws.close();
            return

    
    

   

def on_open(ws):
    ws.send(json.dumps({'method': 'INFO', 'packets': 30}))
    ws.send(json.dumps({'method': 'REQ_PORT'}))
    #send_packets()



def send_json(ws):
    pass


if __name__ == "__main__":
    websocket.enableTrace(True)
    ws = websocket.WebSocketApp("ws://127.0.0.1:8888/bandwidth",
                                  on_message = on_message,
                                  on_error = on_error,
                                  on_close = on_close)
    ws.on_open = on_open
    ws.run_forever()

