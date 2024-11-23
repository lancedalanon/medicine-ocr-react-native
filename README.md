# Medicine OCR Mobile

![React Native](https://img.shields.io/badge/React%20Native-61DBFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-1B1F3A?style=for-the-badge&logo=expo&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-000000?style=for-the-badge&logo=flask&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Expo Camera](https://img.shields.io/badge/Expo%20Camera-000000?style=for-the-badge&logo=expo&logoColor=white)
![Expo Speech](https://img.shields.io/badge/Expo%20Speech-000000?style=for-the-badge&logo=expo&logoColor=white)
![Expo Media Library](https://img.shields.io/badge/Expo%20Media%20Library-000000?style=for-the-badge&logo=expo&logoColor=white)
![Ionicons](https://img.shields.io/badge/Ionicons-4285F4?style=for-the-badge&logo=ionic&logoColor=white)

**Medicine OCR Mobile** is a React Native app built with Expo that leverages Optical Character Recognition (OCR) to detect and extract text from images. The app integrates with a Flask backend to process the images and return the OCR results. Additionally, the app features Text-to-Speech (TTS), enabling users to listen to the detected text.

## Features
- **Capture Image**: Use your device's camera to capture images for OCR processing.
- **OCR Detection**: Automatically detects and extracts text from captured images.
- **Text-to-Speech (TTS)**: Allows users to listen to the detected text aloud.
- **IP Configuration**: Configure the backend IP address for OCR processing.
- **Camera Toggle**: Switch between front and back cameras to capture images.
- **Image Gallery Access**: Access and select images from the device's media library for OCR.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or later)
- **Expo CLI**: Install it globally using `npm install -g expo-cli`
- **React Native Development Environment**: Required for building the app on iOS/Android
- **Flask Backend**: The app relies on a Flask API for OCR processing. You can find the backend repository [here](https://github.com/lancedalanon/medicine-ocr-flask-api).

You will also need the following dependencies:
- **Expo Camera** (`expo-camera`)
- **Expo Speech** (`expo-speech`)
- **Expo Media Library** (`expo-media-library`)
- **Ionicons** (`@expo/vector-icons`)

## Installation

### 1. Clone the repository:
```bash

git clone https://github.com/lancedalanon/medicine-ocr-mobile.git
```
2. Navigate to the project directory:
```bash

cd medicine-ocr-mobile
```
3. Install the dependencies:
```bash

npm install
```
4. Install necessary Expo packages:
```bash

expo install expo-camera expo-media-library expo-speech @expo/vector-icons
```
5. Start the app:
```bash

expo start
```
This will open a QR code in the terminal that you can scan using the Expo Go app on your phone.

## Usage
Grant Permissions: When first launched, the app will request permissions for the camera and media library. Make sure to grant these permissions to use the camera and save images.
Capture an Image: Press the "Capture" button to open the camera. You can toggle between the front and back cameras using the "Flip" button.
Process Image: After capturing the image, the text detected from the image will appear in a text input box.
Speak Text: Press the "Speak" button to listen to the detected text via Text-to-Speech.
Settings: Tap on the settings icon to input the IP address of the backend server.
Backend Integration
The app sends captured images to a Flask backend for OCR processing. The backend should be running and accessible via the provided IP address.

## Flask Backend Repository: [Medicine OCR Flask API](https://github.com/lancedalanon/medicine-ocr-flask-api)
Backend Endpoint: /process-image
Make sure that the Flask API is up, .env file has been setup with the API_KEY and running before using the app.

## Sample Backend Request:
The app sends a POST request to the backend with the captured image data:

```bash

POST http://<server-ip>:5000/process-image
Headers:

X-API-KEY: Your API key for authentication.
Body:

image: The captured image, passed as a FormData object.
json
Copy code
{
  "image": "<captured_image>"
}
```

## Configuration
The app allows you to configure the IP address of the Flask server that processes the OCR images. You can set the backend server's IP address from the app’s settings modal. This IP address is saved and used for all subsequent API requests.

## Development
To contribute to this project:

Fork the repository.
Create a new branch for your changes.
Make your changes.
Commit your changes.
Push to your forked repository.
Submit a pull request.
Sample Code Changes
Here’s a small code snippet that demonstrates how to integrate the image capture and OCR processing features:

```javascript

Copy code
import * as Camera from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as Speech from 'expo-speech';
import { useState } from 'react';
import { Button, View, TextInput, Alert } from 'react-native';

const CaptureAndProcess = () => {
  const [image, setImage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  
  // Function to capture an image and process it using the backend
  const captureImage = async () => {
    let permission = await Camera.requestCameraPermissionsAsync();
    if (permission.granted) {
      // Capture image and set it
      let result = await Camera.takePictureAsync();
      setImage(result.uri);
      
      // Send image to backend for OCR
      const response = await fetch('http://<server-ip>:5000/process-image', {
        method: 'POST',
        body: JSON.stringify({ image: result.uri }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setOcrText(data.text);  // Set the OCR text result
    } else {
      Alert.alert('Permission Denied', 'Camera access is required.');
    }
  };

  // Function to speak the OCR text
  const speakText = () => {
    Speech.speak(ocrText);
  };

  return (
    <View>
      <Button title="Capture Image" onPress={captureImage} />
      {image && <TextInput value={ocrText} />}
      <Button title="Speak" onPress={speakText} />
    </View>
  );
};
```

## Troubleshooting
Camera Not Working: Ensure the app has the necessary permissions to access the camera. If the camera is still not working, try restarting the app or resetting the device's camera permissions.

OCR Result Not Displayed: Check if the backend is running and accessible. Ensure that the backend server’s IP address is correctly configured in the app settings.

TTS Not Working: Ensure that the device’s audio is on, and the app has permission to access the speaker. If TTS doesn’t work, try restarting the app.

## License
This project is licensed under the MIT License. See the LICENSE file for more details.
