from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Define the list of note labels used for mapping
noteLabels = ["A", "Bb", "B", "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab"]

@app.route('/', methods=['POST'])
def receive_data():
    data = request.json
    rectangles = data.get('rectangles', [])
    message = data.get('message', "")
    abc_notation = convert_to_abc(rectangles)
    print("Received message:", message)
    print("ABC Notation:\n", abc_notation)
    return jsonify({"status": "success", "data_received": data, "abc_notation": abc_notation})

@app.route('/')
def index():
    return "The server is running."

topPadding = 100  # This should match the 'topPadding' used in your JavaScript
lineSpacing = 20  # This should match the 'lineSpacing' used in your JavaScript
noteLabels = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"]  # Ensure this order matches your frontend logic

def convert_to_abc(rectangles):
    # Extended note labels for ABC notation
    notes_abc = {
        "C": "C", "Db": "_D", "D": "D", "Eb": "_E", "E": "E", "F": "F",
        "Gb": "_G", "G": "G", "Ab": "_A", "A": "A", "Bb": "_B", "B": "B"
    }
    base_octave = 5  # Adjust based on the range your application covers

    abc_notation = "X:1\nT:Music Piece\nM:4/4\nL:1/8\nK:C\n|"

    processed_rectangles = []
    for rect in rectangles:
        top = int(rect['top'].replace('px', ''))
        width = int(rect['width'].replace('px', ''))
        note_index = 11 - ((top - topPadding) // lineSpacing) % 12  # Inverted index calculation
        octave_offset = ((top - topPadding) // lineSpacing) // 12  # Calculate octave offset
        duration = width // 20  # Example conversion ratio for width to duration
        note = notes_abc[noteLabels[note_index]] + str(base_octave - octave_offset)  # Adjust octave calculation
        processed_rectangles.append({'note': note, 'duration': duration, 'start': int(rect['left'].replace('px', ''))})

    processed_rectangles.sort(key=lambda x: x['start'])

    current_measure = 0
    i = 0
    while i < len(processed_rectangles):
        rect = processed_rectangles[i]
        chord = [rect]
        duration = rect['duration']

        while i + 1 < len(processed_rectangles) and processed_rectangles[i + 1]['start'] == rect['start']:
            chord.append(processed_rectangles[i + 1])
            i += 1

        if len(chord) > 1:
            abc_notation += "[" + ''.join(c['note'] for c in chord) + "]" + str(duration)
        else:
            abc_notation += rect['note'] + (str(duration) if duration > 1 else '')

        current_measure += duration
        if current_measure >= 8:
            abc_notation += " |"
            current_measure %= 8
        
        i += 1

    if current_measure != 0:
        abc_notation += " |"

    return abc_notation


if __name__ == "__main__":
    app.run(debug=True)
