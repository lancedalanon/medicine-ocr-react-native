import { useEffect, useRef, useState } from 'react';
import { Platform, ActivityIndicator, Button, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, SafeAreaView, Modal } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Camera, CameraType } from 'expo-camera/legacy';
import * as Speech from 'expo-speech';
import { API_KEY } from '@env'; 
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [facing, setFacing] = useState(CameraType.back);
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [mediaPermission, setMediaPermission] = useState<boolean | null>(null);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); 
  const [modalVisible, setModalVisible] = useState(false);
  const [ipAddress, setIpAddress] = useState('192.168.68.106');
  const [inputIpAddress, setInputIpAddress] = useState(ipAddress);
  const cameraRef = useRef<Camera>(null);

  function sendXmlHttpRequest(data) {
    const xhr = new XMLHttpRequest();  // Create a new XMLHttpRequest object
  
    return new Promise((resolve, reject) => {
      // Define the behavior when the state of the request changes
      xhr.onreadystatechange = e => {
        if (xhr.readyState !== 4) {
          return;  // Wait until the request is complete
        }
  
        // If the request is successful (HTTP status 200), resolve the promise
        if (xhr.status === 200) {
          resolve(JSON.parse(xhr.responseText));  // Parse and return the response JSON
        } else {
          reject("Request Failed");  // Reject with an error message if the request fails
        }
      };
  
      // Open a POST request to the server endpoint
      xhr.open("POST", `http://${ipAddress}:5000/process-image`);
  
      // Set the 'X-API-KEY' header with the API key value
      xhr.setRequestHeader("X-API-KEY", API_KEY);
  
      // Send the request with the provided data
      xhr.send(data);
    });
  }

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

  const handleCapturePress = async () => {
    if (cameraRef.current) {
      setIsLoading(true); // Start loading
      try {
        // Capture the photo
        const photo = await cameraRef.current.takePictureAsync({ quality: 1, base64: false });
        setCapturedImageUri(photo.uri);
        setIsCameraVisible(false); // Hide camera view
  
        const photoData = new FormData();
        photoData.append("image", {
          uri: photo.uri, // Use the URI of the captured photo
          name: 'captured_photo.jpg', // You can set a dynamic filename here
          type: 'image/jpeg' // Make sure this matches the actual image type
        });
  
        // Send the photo data to the server
        const ocrResponse = await sendXmlHttpRequest(photoData);
        setOcrResult(ocrResponse.data || 'No text found');
      } catch (e: any) {
        console.error(e);
        Alert.alert('Error capturing image', e.message);
      } finally {
        setIsLoading(false); // End loading
      }
    }
  };  

  // Function to handle the submission of the IP address form
  const handleSubmitIpAddress = () => {
    setIpAddress(inputIpAddress); // Update the state with the new IP address
    setModalVisible(false); // Close the modal
  };

  // Function to speak the OCR result
  const handleSpeakPress = () => {
    if (ocrResult) {
      Speech.speak(ocrResult);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Settings gear icon */}
      <TouchableOpacity 
        style={styles.gearIcon} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="settings" size={32} color="black" />
      </TouchableOpacity>
      
      <View style={styles.container}>
        {!isCameraVisible ? (
          <>
            {capturedImageUri ? (
              <>
                <TextInput
                  style={styles.ocrTextArea}
                  value={ocrResult || ''}
                  multiline
                  placeholder="Please capture an image"
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
                    disabled={isLoading} // Disable the button while loading
                  >
                    {isLoading ? ( // Check if loading to render spinner
                      <ActivityIndicator size="large" color="#fff" /> // Customize size and color as needed
                    ) : (
                      <Text style={styles.recaptureText}>Retake</Text>
                    )}
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
                <Text style={styles.text}>Capture</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={() => setIsCameraVisible(false)}>
                <Text style={styles.text}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Camera>
        )}
      </View>

      {/* Modal for IP Address Form */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Enter Server IP Address</Text>
          <TextInput
            style={styles.ipInput}
            value={inputIpAddress}
            onChangeText={setInputIpAddress}
            placeholder="Enter IP address"
            keyboardType="numeric"
          />
          <View style={styles.modalButtonContainer}>
            <Button title="Submit" onPress={handleSubmitIpAddress} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="red" />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',     
  },
  gearIcon: {
    position: 'absolute',   
    top: 10,                
    left: 10,              
    zIndex: 1,  
    marginBottom: 20,            
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
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'grey',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#fff',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%', 
    marginTop: 20, 
  },
  ipInput: {
    width: 250,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
});