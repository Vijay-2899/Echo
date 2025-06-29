from flask_socketio import SocketIO

from flask import Flask

app = Flask(__name__)
socketio = SocketIO(app)

@socketio.on('hello')
def test_message(message):
    socketio.emit('hello', message)

if __name__ == '__main__':
    socketio.run(app)
