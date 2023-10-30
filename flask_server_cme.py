from flask import Flask, render_template, request
from flask_cors import CORS
import requests

from flask import jsonify
import json


app = Flask(__name__)
CORS(app)



COGNITO_TOKEN_ENDPOINT = "https://logismart.auth.ap-southeast-1.amazoncognito.com/oauth2/token"  # Replace with your Cognito User Pool token endpoint URL
CLIENT_ID = "4r0v8l1ojkssjghnquganv8jrk"  # Replace with your Cognito App Client ID
CLIENT_SECRET = "1bfjkoa5nhtan21hsrrbkdhiccstplqsnr0do3h2e9t437657k2r"  # Replace with your Cognito App Client Secret
REDIRECT_URI = "http://localhost:8000/driver_index_cme.html"  # Replace with your frontend redirect URI after login

@app.route('/upload_file', methods=['POST'])
def upload_file():
    uploaded_file = request.files['file']
    
    if uploaded_file:
        file_name = uploaded_file.filename
        accessToken = request.form['accessToken']
        api_base_url = "https://ugeafjv3o3.execute-api.ap-southeast-1.amazonaws.com/presignedurlgenerator"
        api_url = f"{api_base_url}?file_name={file_name}"
        

        headers = {'Authorization': f'Bearer {accessToken}'}
        
        response = requests.post(api_url, headers=headers)
        response_result = json.loads(response.text)
        
        uploaded_file.save(file_name)
        with open(file_name, 'rb') as file_data:
            file_bytes = file_data.read()
        
        # Save the uploaded file
        print(response_result['url'])
        r = requests.post(response_result['url'], data=response_result['fields'], files={'file': (file_name, file_bytes)})
        print(r.status_code)
        return jsonify({'file_name': file_name})
    else:
        return jsonify({'error': 'No file uploaded'})
    
@app.route('/exchange-code', methods=['POST'])
def exchange_code():
    try:
        
        data = request.get_json()
        print(data)
        authorization_code = data.get('authorizationCode')
        print(authorization_code)
        
        response = requests.post(
            COGNITO_TOKEN_ENDPOINT,
            data={
                'grant_type': 'authorization_code',
                'client_id': CLIENT_ID,
                'client_secret': CLIENT_SECRET,
                'code': authorization_code,
                'redirect_uri': REDIRECT_URI
            }
        )

        if response.ok:
            tokens = response.json()
            
            return jsonify(tokens), 200
        else:
            return jsonify({'error': 'Failed to exchange authorization code'}), response.status_code

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)