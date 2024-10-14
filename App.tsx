import { useEffect, useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Camera, CameraType } from 'expo-camera/legacy';
import MlkitOcr from 'react-native-mlkit-ocr';
import * as Speech from 'expo-speech';

export default function App() {
  const [facing, setFacing] = useState(CameraType.back); // Use proper CameraType
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null); // Fix: Correct state setter
  const [mediaPermission, setMediaPermission] = useState<boolean | null>(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null); // Store OCR result
  const cameraRef = useRef<Camera>(null); // Use Camera instead of CameraView

  // Request camera and media permissions
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(cameraStatus === 'granted'); // Use the correct setter

      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
      setMediaPermission(mediaStatus === 'granted');
    })();
  }, []);

  if (cameraPermission === null || mediaPermission === null) {
    return <View />; // Loading state
  }

  if (!cameraPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={() => Camera.requestPermissionsAsync()} title="Grant Camera Permission" />
      </View>
    );
  }

  if (!mediaPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need permission to save photos to your library</Text>
        <Button
          onPress={async () => {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            setMediaPermission(status === 'granted');
          }}
          title="Grant Media Library Permission"
        />
      </View>
    );
  }

  // Toggle the camera facing direction
  function toggleCameraFacing() {
    setFacing(current => (current === CameraType.back ? CameraType.front : CameraType.back));
  }

  // Function to capture the photo
  const handleCapturePress = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 1, base64: false });
        setCapturedImageUri(photo.uri); // Store the captured image URI
        setIsCameraVisible(false); // Hide camera view
        const resultFromUri = await MlkitOcr.detectFromUri(photo.uri);
        setOcrResult(resultFromUri[0]?.text || 'No text found'); // Save OCR result
      } catch (e: any) {
        console.error(e);
        alert('Error capturing image: ' + e.message);
      }
    }
  };

  // Function to speak the OCR result
  const handleSpeakPress = () => {
    if (ocrResult) {
      Speech.speak(ocrResult);
    }
  };

  // Show camera view
  return (
    <View style={styles.container}>
      {!isCameraVisible ? (
        <>
          {capturedImageUri ? (
            <>
              {/* Display OCR result in a read-only textarea (TextInput) */}
              <TextInput
                style={styles.ocrTextArea}
                value={ocrResult || ''}
                multiline
                placeholder='Please capture an image'
              />
              {/* Image preview displayed below the OCR text */}
              <Image
                source={{ uri: capturedImageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={() => {
                    setCapturedImageUri(null);
                    setOcrResult(null);
                    setIsCameraVisible(true);
                  }}>
                  <Text style={styles.recaptureText}>Retake</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.captureButton} onPress={handleSpeakPress}>
                  <Text style={styles.captureText}>Speak</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity style={styles.captureButton} onPress={() => setIsCameraVisible(true)}>
              <Text style={styles.captureText}>Capture</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <Camera ref={cameraRef} style={styles.camera} type={facing}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
              <Text style={styles.text}>Flip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleCapturePress}>
              <Text style={styles.text}>Capture</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setIsCameraVisible(false)}>
              <Text style={styles.text}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Camera>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  captureButton: {
    padding: 20,
    backgroundColor: 'blue',
    borderRadius: 10,
    marginHorizontal: 10, // Add margin between buttons
  },
  recaptureText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  captureText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  buttonRow: {
    flexDirection: 'row', // Row layout for the buttons
    justifyContent: 'center',
    width: '100%',
    marginTop: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginVertical: 10,
  },
  ocrTextArea: {
    width: '100%',
    height: 300,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 10,
    textAlignVertical: 'top',
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    fontSize: 32,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
