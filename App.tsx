import { useEffect, useRef, useState } from 'react';
import { Button, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { captureRef } from 'react-native-view-shot';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, setMediaPermission] = useState<boolean | null>(null); // Correct state definition
  const [isCameraVisible, setIsCameraVisible] = useState(false); // State to toggle camera visibility
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null); // State to store the captured image URI
  const cameraRef = useRef<CameraView>(null); // Use cameraRef for CameraView

  // Request camera and media permissions
  useEffect(() => {
    (async () => {
      // Request camera permission
      const { status: cameraStatus } = await requestCameraPermission();
      if (cameraStatus === 'granted') {
        // If camera permission is granted, check for media library permission
        const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();
        setMediaPermission(mediaStatus === 'granted'); // Use the correct setter function
      } else {
        // Handle the case when camera permission is denied
        alert('Camera permission is required to use this app');
      }
    })();
  }, [requestCameraPermission]);

  // Check if both permissions are granted
  if (!cameraPermission || mediaPermission === null) {
    // Permissions are still loading.
    return <View />;
  }

  if (!cameraPermission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestCameraPermission} title="Grant Camera Permission" />
      </View>
    );
  }

  if (!mediaPermission) {
    // Media Library permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need permission to save photos to your library</Text>
        <Button onPress={async () => {
          const { status } = await MediaLibrary.requestPermissionsAsync();
          setMediaPermission(status === 'granted'); // Request media library permissions
        }} title="Grant Media Library Permission" />
      </View>
    );
  }

  // Function to toggle the camera facing direction
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // Function to handle the Capture button click
  function handleCapturePress() {
    setIsCameraVisible(true); // Show camera view
  }

  // Function to handle Save button click
  const handleSavePress = async () => {
    if (cameraRef.current) {
      try {
        const localUri = await captureRef(cameraRef, {
          height: 440,
          quality: 1,
        });

        setCapturedImageUri(localUri); // Store the captured image URI for preview
      } catch (e) {
        console.log(e);
        alert('Error saving image: ' + e.message);
      }
    }

    setIsCameraVisible(false);
  };

  // Function to handle Cancel button click
  function handleCancelPress() {
    setIsCameraVisible(false); // Close camera view
  }

  return (
    <View style={styles.container}>
      {!isCameraVisible ? (
        <>
          {capturedImageUri ? (<>
            <Image
              source={{ uri: capturedImageUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.captureButton} onPress={handleCapturePress}>
              <Text style={styles.captureText}>Capture</Text>
            </TouchableOpacity>
          </>) : (
            <TouchableOpacity style={styles.captureButton} onPress={handleCapturePress}>
              <Text style={styles.captureText}>Capture</Text>
            </TouchableOpacity>
          )}
        </>
      ) : (
        <View style={styles.cameraContainer}>
          <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                <Text style={styles.text}>Flip Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleSavePress}>
                <Text style={styles.text}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleCancelPress}>
                <Text style={styles.text}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
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
  cameraContainer: {
    flex: 1,
    width: '100%', // Full width for camera
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute', // Position the button container absolutely
    bottom: 0, // Align to the bottom
    left: 0, // Align to the left
    right: 0, // Align to the right
    flexDirection: 'row',
    justifyContent: 'space-evenly', // Spread out buttons evenly
    alignItems: 'center',
    padding: 16, // Add padding around buttons
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Slightly transparent background for better visibility
  },
  button: {
    flex: 1,
    alignItems: 'center',
  },
  captureButton: {
    alignSelf: 'center',
    padding: 20,
    backgroundColor: 'blue', // Style for capture button
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
