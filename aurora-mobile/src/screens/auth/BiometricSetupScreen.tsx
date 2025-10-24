import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const BiometricSetupScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Biometric Setup Placeholder</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
  },
  text: {
    color: '#f8fafc',
    fontSize: 18,
  },
});

export default BiometricSetupScreen;
