import { useEffect, useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Camera, CameraType } from 'expo-camera/legacy';

export default function App() {
  const [facing, setFacing] = useState(CameraType.back); // Use proper CameraType
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null); // Fix: Correct state setter
  const [mediaPermission, setMediaPermission] = useState<boolean | null>(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
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
      } catch (e) {
        console.error(e);
        alert('Error capturing image: ' + e.message);
      }
    }
  };

  // Show camera view
  return (
    <View style={styles.container}>
      {!isCameraVisible ? (
        <>
          {capturedImageUri ? (
            <>
              <Image
                source={{ uri: capturedImageUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <TouchableOpacity style={styles.captureButton} onPress={() => setIsCameraVisible(true)}>
                <Text style={styles.captureText}>Retake</Text>
              </TouchableOpacity>
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
    justifyContent: 'space-evenly',
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  captureButton: {
    alignSelf: 'center',
    padding: 20,
    backgroundColor: 'blue',
    borderRadius: 10,
    marginTop: 20,
  },
  captureText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 10,
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
