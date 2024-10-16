import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Button, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Camera, CameraType } from 'expo-camera/legacy';
import * as Speech from 'expo-speech';
import { API_URL, API_KEY } from '@env'; 

export default function App() {
  const [facing, setFacing] = useState(CameraType.back);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [mediaPermission, setMediaPermission] = useState<boolean | null>(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const cameraRef = useRef<Camera>(null);

  // Request camera and media permissions
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(cameraStatus === 'granted');

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
      setIsLoading(true); // Start loading
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 1, base64: false });
        setCapturedImageUri(photo.uri);
        setIsCameraVisible(false); // Hide camera view

        // Fetch the image as a Blob
        const response = await fetch(photo.uri);
        const blob = await response.blob();

        // Prepare data for API request
        const bodyData = new FormData();
        bodyData.append('image', blob, 'photo.jpg'); // Attach the image blob

        // Make the API call
        const apiResponse = await fetch(`${API_URL}/process-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-API-KEY': API_KEY, // Use X-API-KEY header for authentication
          },
          body: bodyData,
        });

        // Parse the response and set the OCR result
        const result = await apiResponse.json();
        setOcrResult(result.text || 'No text found');
      } catch (e: any) {
        console.error(e);
        Alert.alert('Error capturing image', e.message);
      } finally {
        setIsLoading(false); // End loading
      }
    }
  };

  // Function to speak the OCR result
  const handleSpeakPress = () => {
    if (ocrResult) {
      Speech.speak(ocrResult);
    }
  };

  return (
    <View style={styles.container}>
      {!isCameraVisible ? (
        <>
          {capturedImageUri ? (
            <>
              <TextInput
                style={styles.ocrTextArea}
                value={ocrResult || ''}
                multiline
                placeholder='Please capture an image'
              />
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
                  }}
                  disabled={isLoading} // Disable button while loading
                >
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
            <TouchableOpacity style={styles.button} onPress={handleCapturePress} disabled={isLoading}>
              {/* Display a loading indicator while capturing */}
              {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.text}>Capture</Text>}
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
    marginHorizontal: 10,
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
    flexDirection: 'row',
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
