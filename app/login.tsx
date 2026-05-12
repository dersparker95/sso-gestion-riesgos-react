import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { iniciarSesion } from '../utils/auth';

export default function LoginScreen() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');

  async function handleLogin() {
    if (!correo.trim() || !password.trim()) {
      Alert.alert('Faltan datos', 'Ingresa correo y contraseña');
      return;
    }

    const usuario = await iniciarSesion(correo.trim(), password.trim());

    if (!usuario) {
      Alert.alert('Acceso denegado', 'Correo o contraseña incorrectos');
      return;
    }

    router.push('/menu');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      <Text style={styles.subtitle}>
        Ingresa con tu cuenta para continuar
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Correo"
        placeholderTextColor="#999"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#999"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
      >
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <View style={styles.demoBox}>
        <Text style={styles.demoTitle}>Usuarios de prueba</Text>

        <Text style={styles.demoText}>
          Juan Pérez — Trabajador
        </Text>
        <Text style={styles.demoSubtext}>
          juan.perez@empresa.cl / 1234
        </Text>

        <Text style={styles.demoText}>
          María González — Supervisor
        </Text>
        <Text style={styles.demoSubtext}>
          maria.gonzalez@empresa.cl / 1234
        </Text>

        <Text style={styles.demoText}>
          Carlos Muñoz — Prevencionista
        </Text>
        <Text style={styles.demoSubtext}>
          carlos.munoz@empresa.cl / 1234
        </Text>

        <Text style={styles.demoText}>
          Ana Rojas — Administrador
        </Text>
        <Text style={styles.demoSubtext}>
          ana.rojas@empresa.cl / 1234
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1E1E1E',
    color: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  button: {
    backgroundColor: '#C62828',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  demoBox: {
    marginTop: 28,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333333',
  },
  demoTitle: {
    color: '#F57C00',
    fontWeight: 'bold',
    marginBottom: 12,
    fontSize: 16,
  },
  demoText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginTop: 8,
  },
  demoSubtext: {
    color: '#CCCCCC',
    marginTop: 2,
  },
});