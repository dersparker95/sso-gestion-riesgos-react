import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usuarios } from '../data/usuarios';

function BotonFiltro({
  texto,
  activo,
  onPress,
}: {
  texto: string;
  activo: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.filtroButton, activo && styles.filtroButtonActivo]}
      onPress={onPress}
    >
      <Text style={[styles.filtroButtonText, activo && styles.filtroButtonTextActivo]}>
        {texto}
      </Text>
    </TouchableOpacity>
  );
}

function UsuarioCard({
  nombre,
  correo,
  rol,
  empresa,
  faena,
  activo,
}: {
  nombre: string;
  correo: string;
  rol: string;
  empresa: string;
  faena: string;
  activo: boolean;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.nombre}>{nombre}</Text>
      <Text style={styles.texto}>Correo: {correo}</Text>
      <Text style={styles.texto}>Rol: {rol}</Text>
      <Text style={styles.texto}>Empresa: {empresa}</Text>
      <Text style={styles.texto}>Faena: {faena}</Text>
      <Text style={[styles.estado, { color: activo ? '#689F38' : '#D32F2F' }]}>
        {activo ? 'Activo' : 'Inactivo'}
      </Text>
    </View>
  );
}

export default function UsuariosScreen() {
  const [filtroFaena, setFiltroFaena] = useState('Todas');
  const [filtroRol, setFiltroRol] = useState('Todos');

  const faenasDisponibles = useMemo(() => {
    const faenas = usuarios.map((usuario) => usuario.faena);
    return ['Todas', ...Array.from(new Set(faenas))];
  }, []);

  const rolesDisponibles = ['Todos', 'Trabajador', 'Supervisor', 'Prevencionista', 'Administrador'];

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const cumpleFaena =
        filtroFaena === 'Todas' || usuario.faena === filtroFaena;

      const cumpleRol =
        filtroRol === 'Todos' || usuario.rol === filtroRol;

      return cumpleFaena && cumpleRol;
    });
  }, [filtroFaena, filtroRol]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Usuarios</Text>
      <Text style={styles.subtitle}>Perfiles registrados en el sistema</Text>

      <View style={styles.filtroBox}>
        <Text style={styles.filtroLabel}>Filtrar por faena</Text>
        <View style={styles.filtroWrap}>
          {faenasDisponibles.map((item) => (
            <BotonFiltro
              key={item}
              texto={item}
              activo={filtroFaena === item}
              onPress={() => setFiltroFaena(item)}
            />
          ))}
        </View>

        <Text style={styles.filtroLabel}>Filtrar por rol</Text>
        <View style={styles.filtroWrap}>
          {rolesDisponibles.map((item) => (
            <BotonFiltro
              key={item}
              texto={item}
              activo={filtroRol === item}
              onPress={() => setFiltroRol(item)}
            />
          ))}
        </View>
      </View>

      {usuariosFiltrados.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No hay usuarios para ese filtro</Text>
        </View>
      ) : (
        usuariosFiltrados.map((usuario) => (
          <UsuarioCard
            key={usuario.id}
            nombre={usuario.nombre}
            correo={usuario.correo}
            rol={usuario.rol}
            empresa={usuario.empresa}
            faena={usuario.faena}
            activo={usuario.activo}
          />
        ))
      )}

      <TouchableOpacity
        style={styles.button}
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
    padding: 16,
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
    marginBottom: 24,
  },
  filtroBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  filtroLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 8,
  },
  filtroWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  filtroButton: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#444444',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  filtroButtonActivo: {
    backgroundColor: '#F57C00',
    borderColor: '#F57C00',
  },
  filtroButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  filtroButtonTextActivo: {
    color: '#FFFFFF',
  },
  emptyBox: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
  },
  emptyText: {
    color: '#CCCCCC',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
  },
  nombre: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  texto: {
    color: '#CCCCCC',
    marginTop: 4,
  },
  estado: {
    marginTop: 10,
    fontWeight: 'bold',
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
});