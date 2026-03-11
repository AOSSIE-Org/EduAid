import os

from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    return "Flask is working"

if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "false").lower() in ("1", "true", "yes")
    app.run(debug=debug_mode)