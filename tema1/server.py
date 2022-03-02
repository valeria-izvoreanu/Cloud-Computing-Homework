from time import time
import threading
import socket
from http.server import BaseHTTPRequestHandler, HTTPServer
import api_comm


class Handler(BaseHTTPRequestHandler):

    def do_GET(self):
        time_before = time()
        self.send_response(200)
        self.end_headers()
        if self.path != "/metrics":
            if self.path == "/movie":
                mess = api_comm.get_youtube_link()
                mess = "<iframe width='420' height='345' src='" + mess + "'></iframe>"
                self.wfile.write(mess.encode("utf8"))
            else:
                f = open('client.html')
                outputdata = f.read()
                f.close()
                self.wfile.write(outputdata.encode('utf8'))
            time_after = time()
            time_taken = time_after - time_before
            f = open("logs.txt", "a")
            text = "GET myServer: " + str(time_taken) + "\n"
            f.write(text)
            f.close()
        else:
            f = open('logs.txt')
            data = f.read()
            f.close()
            self.wfile.write(data.encode('utf8'))
        return


class Thread(threading.Thread):
    def __init__(self, i):
        threading.Thread.__init__(self)
        self.i = i
        self.daemon = True
        self.start()

    def run(self):
        httpd = HTTPServer(addr, Handler, False)

        httpd.socket = sock
        httpd.server_bind = self.server_close = lambda self: None

        httpd.serve_forever()


addr = ('', 8000)
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
sock.bind(addr)
sock.listen(100)

i = 0
while True:
    sock.accept()
    thread = Thread(i)
