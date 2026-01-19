import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import styles from '../styles/commonStyles';
import api from '../services/api';

export default function ReceiptUploadScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permissions are required to upload receipts.');
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error(error);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permissions are required to take photos.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
      console.error(error);
    }
  };

  const uploadReceipt = async () => {
    if (!selectedImage) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }

    try {
      setUploading(true);

      // Create FormData for file upload
      const formData = new FormData();
      
      // Extract filename from URI
      const filename = selectedImage.uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append('file', {
        uri: selectedImage.uri,
        name: filename,
        type: type,
      });

      const response = await api.post('/finance/receipts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert(
        'Success!', 
        'Receipt uploaded successfully! 🎉',
        [
          { 
            text: 'OK', 
            onPress: () => {
              setSelectedImage(null);
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.response?.data?.error || 'Failed to upload receipt');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        {/* Header */}
        <View style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ fontSize: 16, color: '#2563eb', fontWeight: '600' }}>← Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1e293b' }}>Upload Receipt</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
          {/* Image Preview */}
          {selectedImage ? (
            <View style={{ marginBottom: 24 }}>
              <Image 
                source={{ uri: selectedImage.uri }} 
                style={{ 
                  width: '100%', 
                  height: 400, 
                  borderRadius: 12,
                  backgroundColor: '#f1f5f9'
                }}
                resizeMode="contain"
              />
              <TouchableOpacity 
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => setSelectedImage(null)}
              >
                <Text style={{ color: '#fff', fontSize: 20 }}>×</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{
              backgroundColor: '#f1f5f9',
              borderRadius: 12,
              padding: 48,
              alignItems: 'center',
              marginBottom: 24,
              borderWidth: 2,
              borderColor: '#e2e8f0',
              borderStyle: 'dashed'
            }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📸</Text>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#64748b', textAlign: 'center' }}>
                Take a photo or choose from library
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={{ gap: 12, marginBottom: 24 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#2563eb',
                padding: 18,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12
              }}
              onPress={takePhoto}
              disabled={uploading}
            >
              <Text style={{ fontSize: 24 }}>📷</Text>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                Take Photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: '#fff',
                padding: 18,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                borderWidth: 2,
                borderColor: '#2563eb'
              }}
              onPress={pickImage}
              disabled={uploading}
            >
              <Text style={{ fontSize: 24 }}>🖼️</Text>
              <Text style={{ color: '#2563eb', fontSize: 16, fontWeight: '600' }}>
                Choose from Library
              </Text>
            </TouchableOpacity>
          </View>

          {/* Upload Button */}
          {selectedImage && (
            <TouchableOpacity
              style={{
                backgroundColor: '#10b981',
                padding: 18,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                opacity: uploading ? 0.6 : 1
              }}
              onPress={uploadReceipt}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <ActivityIndicator color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                    Uploading...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 24 }}>☁️</Text>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                    Upload Receipt
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* Info Card */}
          <View style={{
            backgroundColor: '#eff6ff',
            padding: 16,
            borderRadius: 12,
            marginTop: 24,
            borderLeftWidth: 4,
            borderLeftColor: '#2563eb'
          }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#1e40af', marginBottom: 8 }}>
              💡 Pro Tip
            </Text>
            <Text style={{ fontSize: 14, color: '#1e40af', lineHeight: 20 }}>
              After uploading, you can use our AI-powered itemization feature on the web to automatically extract items and prices! ($5/month premium feature)
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
