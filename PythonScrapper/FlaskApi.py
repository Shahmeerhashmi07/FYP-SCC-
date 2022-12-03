from flask import Flask, jsonify
from hello import *
app = Flask(__name__)


@app.route("/")
def scrap():
    schedule.every(5).seconds.do(scrapper)
    while 1:
        schedule.run_pending()
        time.sleep(1)
    return jsonify("This is Scrapper")


if __name__ == "__main__":
    app.run(debug=True)
