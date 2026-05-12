import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const categoriasBase = [
  'Infraestructura',
  'Electricidad',
  'Maquinaria',
  'EPP',
  'Orden y limpieza',
  'Señalización',
  'Tránsito',
  'Sustancias peligrosas',
  'Herramientas',
  'Otro',
] as const;

export default function RegistrarRiesgoScreen() {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [categoriaOtra, setCategoriaOtra] = useState('');
  const [nivel, setNivel] = useState<1 | 2 | 3 | 4 | 5>(3);

  function handleSiguiente() {
    const categoriaFinal =
      categoria === 'Otro' ? categoriaOtra.trim() : categoria;

    if (!titulo.trim() || !descripcion.trim() || !categoriaFinal.trim()) {
      Alert.alert('Faltan datos', 'Completa todos los campos antes de continuar');
      return;
    }

    router.push({
      pathname: '/evidencia-riesgo',
      params: {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        categoria: categoriaFinal,
        nivel: String(nivel),
      },
    });
  }

  function BotonNivel({ valor }: { valor: 1 | 2 | 3 | 4 | 5 }) {
    const seleccionado = nivel === valor;

    return (
      <TouchableOpacity
        style={[styles.nivelButton, seleccionado && styles.nivelButtonActivo]}
        onPress={() => setNivel(valor)}
      >
        <Text style={[styles.nivelButtonText, seleccionado && styles.nivelButtonTextActivo]}>
          {valor}
        </Text>
      </TouchableOpacity>
    );
  }

  function BotonCategoria({ valor }: { valor: string }) {
    const seleccionada = categoria === valor;

    return (
      <TouchableOpacity
        style={[styles.categoriaButton, seleccionada && styles.categoriaButtonActiva]}
        onPress={() => setCategoria(valor)}
      >
        <Text
          style={[
            styles.categoriaButtonText,
            seleccionada && styles.categoriaButtonTextActiva,
          ]}
        >
          {valor}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Registrar riesgo</Text>
      <Text style={styles.subtitle}>
        Paso 1: Ingresa los datos del hallazgo
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Título del riesgo"
        placeholderTextColor="#999"
        value={titulo}
        onChangeText={setTitulo}
      />

      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Descripción"
        placeholderTextColor="#999"
        multiline
        value={descripcion}
        onChangeText={setDescripcion}
      />

      <Text style={styles.label}>Categoría</Text>

      <View style={styles.categoriasWrap}>
        {categoriasBase.map((item) => (
          <BotonCategoria key={item} valor={item} />
        ))}
      </View>

      {categoria === 'Otro' && (
        <TextInput
          style={styles.input}
          placeholder="Especifica la categoría"
          placeholderTextColor="#999"
          value={categoriaOtra}
          onChangeText={setCategoriaOtra}
        />
      )}

      <Text style={styles.label}>Nivel de riesgo</Text>

      <View style={styles.nivelesRow}>
        <BotonNivel valor={1} />
        <BotonNivel valor={2} />
        <BotonNivel valor={3} />
        <BotonNivel valor={4} />
        <BotonNivel valor={5} />
      </View>

      <Text style={styles.nivelTexto}>
        {nivel === 1 && '1 - Muy bajo'}
        {nivel === 2 && '2 - Bajo'}
        {nivel === 3 && '3 - Medio'}
        {nivel === 4 && '4 - Alto'}
        {nivel === 5 && '5 - Crítico'}
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleSiguiente}>
        <Text style={styles.buttonText}>Siguiente</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.buttonMenu}
        onPress={() => router.push('/menu')}
      >
        <Text style={styles.buttonText}>Volver al menú principal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 24,
    paddingBottom: 32,
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
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 4,
  },
  categoriasWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  categoriaButton: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  categoriaButtonActiva: {
    backgroundColor: '#F57C00',
    borderColor: '#F57C00',
  },
  categoriaButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  categoriaButtonTextActiva: {
    color: '#FFFFFF',
  },
  nivelesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  nivelButton: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nivelButtonActivo: {
    backgroundColor: '#C62828',
    borderColor: '#C62828',
  },
  nivelButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  nivelButtonTextActivo: {
    color: '#FFFFFF',
  },
  nivelTexto: {
    color: '#CCCCCC',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#C62828',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonMenu: {
    backgroundColor: '#F57C00',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});