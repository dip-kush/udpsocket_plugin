import tornado.web
import tornado.websocket
import tornado.ioloop
import json
import socket
import time
from random import randrange
from threading import Thread,Lock
import sys
import random, string


time_out = 10 


def print_msg(self, code, body):
    self.write_message(json.dumps({'code': code, 'info': body}))

def ratio(numo,deno):
    print numo,"by %d"%deno

def randomword(length):
   return ''.join(random.choice(string.lowercase) for i in range(length))

def recvPackets(self, sock):
    global max_ping
    packets = 300
    count = 0
    cur_time = time.time()
    sock.settimeout(time_out)
    sending_addr = ()
    flag = True
    '''
    data, sending_addr = sock.recvfrom(5);
    print data
    self.write_message(json.dumps({'code': 206}))
     
    
    '''
    print "Starting listener"
    while True:
        try:
            data,addr = sock.recvfrom(1500)
            #print 'recieved:', data
            count = count + 1
            print 'recieved packets:',count
            sending_addr = addr
            print_msg(self, 200, count)
        except socket.timeout:
            if count == 0:
                flag = False
                print_msg(self, 501, "firewall Nat Problem")
            break
    print sending_addr
    rem_packets = packets 
    while rem_packets and flag:
        sock.sendto(bytearray(randomword(1250)), sending_addr)
        rem_packets-=1
        print 'sending packetss', packets - rem_packets


    if rem_packets == 0: 
        print_msg(self, 203, packets)
    #self.write_message(json.dumps({'code': 205})) 
    #ratio(count, self.cl_packets)
    #message = {'code': 202, 'speed': upload_speed}
    #self.write_message(json.dumps(message))   

class PortAllocator(object):
    '''
       port allocator.
    '''
    def __init__(self, low, high):
        self.ports = {}
        self.low = low
        self.high = high
        for i in range(low, high, 4):
            self.ports[i] = 0
        self.port_available = len(self.ports)
        self.port_allocated = 0

    def alloc(self):
        '''
            allocates a port randomly.
        '''
        if self.port_allocated >= self.port_available:
            return 0
        while 1:
            port = randrange(self.low, self.high, 4)
            if self.ports[port] == 0:
                self.ports[port] = 1
                self.port_allocated += 1
                print port
                return port

    def free(self, port):
        '''
            free port if allocated.
        '''
        if port <= self.high and port >= self.low:
            # to be sure of allocation and double free.
            if self.ports[port]:
                self.ports[port] = 0
                self.port_allocated -= 1
                print self.port_allocated

global_port_allocator = PortAllocator(50000, 50100)

class WebSocketHandler(tornado.websocket.WebSocketHandler):
    def open(self):
        print "new Client connected"
        message = {'code': 204, 'body': 'you are connected'}
        self.write_message(json.dumps(message))
    def on_message(self,message):
        count = 0;
        try:
            request = json.loads(message);
            if request['method']=='REQ_PORT':
                self.client_start(message)
                #self.port_allocated = global_port_allocator.alloc()
                #self.write_message('%s'%self.port_allocated)
                #count = recvPackets(self.port_allocated)
                #print "total received packets by server",count
                #ratio(count, self.cl_packets)
                #self.write_message("total recieved packets by server %s"%count)
            elif request['method'] == 'INFO':
                self.cl_packets = request['packets']
                print "packets sent by client :",request['packets'] 
            elif request['method'] == 'ACK':
                self.ack_packets = request['packets']
                print "packets recieved by client:",request['packets']
            #elif request['method'] == 'SIZE':
                #print request['body']
        except(KeyError, ValueError, TypeError) as e:
            print 'error',e 
            message = {'code': 400, 'body':'bad_message'} 
        #except:
           #   message = {'code': 500, 'body': 'server_error'}
        #`self.write_message(message)
    def client_start(self, message):
        port_allocation_try = 5
        print 'starting server'
        while port_allocation_try:
            port_allocation_try-=1
            self.port_allocated = global_port_allocator.alloc()
            if self.port_allocated:
                try:
                    print "binding socket" 
                    sock = socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
                    sock.bind(('127.0.0.1', self.port_allocated))
                    print "the allocated port", self.port_allocated
                    thread = Thread(target = recvPackets, args= (self,sock))
                    thread.start()
                    message = {'code': 201, 'ip': '127.0.0.1', 'port': self.port_allocated} 
                    break
                except:
                    print sys.exc_info()
                    global_port_allocator.free(self.port_allocated)
            else:
                print_msg(self, 502, 'server busy')
                print "server is busy"                               
        self.write_message(json.dumps(message))
        '''
        else:
            print "server is busy"
            print_msg(self, 502, 'server busy')    
            try:
                self.close()
            except: 
                print "close doesnot exist"
        '''

    def on_close(self):
        print "client disconneted"
        global_port_allocator.free(self.port_allocated)



application = tornado.web.Application([
    (r'/bandwidth',WebSocketHandler),
])


if __name__ =="__main__":
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()

