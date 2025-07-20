
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, join_room, leave_room, send, emit
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
import base64

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

server_private_key = ec.generate_private_key(ec.SECP384R1())
server_public_key = server_private_key.public_key()

shared_keys = {}

@socketio.on('send_message')
def handle_send_message(data):
    room = data.get('room')
    user_id = data.get('user_id')
    display_name = data.get('display_name')
    message = data.get('message')
    if room and message:
        socketio.emit('receive_message', {
            'user_id': user_id,
            'display_name': display_name,
            'message': message
        }, room=room)

@socketio.on('join')
def on_join(data):
    room = data.get('room')
    display_name = data.get('display_name')
    if room:
        join_room(room)
        send({'msg': f"{display_name} has joined the room."}, room=room)

@socketio.on('leave')
def on_leave(data):
    room = data.get('room')
    display_name = data.get('display_name')
    if room:
        leave_room(room)
        send({'msg': f"{display_name} has left the room."}, room=room)

@socketio.on('client_public_key')
def handle_client_public_key(data):
    sid = request.sid if hasattr(request, 'sid') else None
    if not sid:
        sid = data.get('sid')
    pem_str = data.get('client_public_key')
    try:
        client_public_key = serialization.load_pem_public_key(pem_str.encode())
        shared_key = server_private_key.exchange(ec.ECDH(), client_public_key)
        derived_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'handshake data'
        ).derive(shared_key)
        shared_keys[sid] = derived_key
        server_pub_pem = server_public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        emit('server_public_key', { 'server_public_key': server_pub_pem.decode() })
    except Exception as e:
        emit('error', { 'msg': f'Key exchange failed: {str(e)}' })

@app.route('/test-ecdh', methods=['POST'])
def test_ecdh():
    data = request.get_json()
    pem_str = data.get('client_public_key')
    try:
        client_public_key = serialization.load_pem_public_key(pem_str.encode())
        shared_key = server_private_key.exchange(ec.ECDH(), client_public_key)
        derived_key = HKDF(
            algorithm=hashes.SHA256(),
            length=32,
            salt=None,
            info=b'handshake data'
        ).derive(shared_key)
        server_pub_pem = server_public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return jsonify({
            'server_public_key': server_pub_pem.decode(),
            'derived_key_sample': base64.b64encode(derived_key).decode()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=True,
        allow_unsafe_werkzeug=True
    )


