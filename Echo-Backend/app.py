from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
import ssl
import random
import os
from email.message import EmailMessage
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
from reportlab.pdfgen import canvas
from PyPDF2 import PdfReader, PdfWriter

app = Flask(__name__)
CORS(app)

otp_store = {}

SMTP_EMAIL = 'your_email@gmail.com'
SMTP_PASS = 'your_app_password'
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 465

@app.route('/send-otp', methods=['POST'])
def send_otp():
    email = request.json.get('email')
    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp
    send_email(email, "Your OTP", f"Your login OTP is: {otp}")
    return jsonify({"msg": "OTP sent"}), 200

@app.route('/verify-otp', methods=['POST'])
def verify_otp():
    email = request.json.get('email')
    otp = request.json.get('otp')
    if otp_store.get(email) == otp:
        return jsonify({"msg": "OTP verified"}), 200
    return jsonify({"msg": "Invalid OTP"}), 401

@app.route('/generate-keys', methods=['POST'])
def generate_keys():
    email = request.json['email']
    name = request.json['name']  # e.g. 'john'
    birthyear = request.json['birthyear']  # e.g. '2000'
    password = (name[:4] + str(birthyear)).lower()


    priv = ec.generate_private_key(ec.SECP384R1(), default_backend())
    pub = priv.public_key()

    priv_pem = priv.private_bytes(
        serialization.Encoding.PEM,
        serialization.PrivateFormat.TraditionalOpenSSL,
        serialization.NoEncryption()
    )
    pub_pem = pub.public_bytes(
        serialization.Encoding.PEM,
        serialization.PublicFormat.SubjectPublicKeyInfo
    )

    pdf_path = f"/tmp/{email.replace('@','_')}_keys.pdf"
    tmp = "/tmp/temp.pdf"
    c = canvas.Canvas(tmp)
    c.drawString(100, 750, "Your Secure Chat Keys")
    c.drawString(100, 720, "Public Key:")
    c.drawString(100, 700, pub_pem.decode().split('\n')[0])
    c.drawString(100, 640, "Private Key (keep safe!):")
    c.drawString(100, 620, priv_pem.decode().split('\n')[0])
    c.save()

    reader = PdfReader(tmp)
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    writer.encrypt(password)
    with open(pdf_path, "wb") as f:
        writer.write(f)
    os.remove(tmp)

    send_email_with_attachment(email, "Your Secure Chat Keys",
                               "Use your password to open the attached PDF.", pdf_path)

    os.remove(pdf_path)

    return jsonify({"msg": "Keys sent via email", "public_key": pub_pem.decode()}), 200

def send_email(to, subject, body):
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = SMTP_EMAIL
    msg['To'] = to
    msg.set_content(body)

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
        server.login(SMTP_EMAIL, SMTP_PASS)
        server.send_message(msg)

def send_email_with_attachment(to, subject, body, filepath):
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = SMTP_EMAIL
    msg['To'] = to
    msg.set_content(body)

    with open(filepath, 'rb') as f:
        msg.add_attachment(f.read(), maintype='application', subtype='pdf', filename=os.path.basename(filepath))

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT, context=context) as server:
        server.login(SMTP_EMAIL, SMTP_PASS)
        server.send_message(msg)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
