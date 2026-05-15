const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 8000;

const riesgosPath = path.join(__dirname, 'database', 'riesgos.json');
const usuariosPath = path.join(__dirname, 'database', 'usuarios.json');

app.use(cors());

app.use(express.json({
  limit: '50mb',
}));

app.use(express.urlencoded({
  limit: '50mb',
  extended: true,
}));

function generarToken(usuario) {
  return `token-${usuario.id}-${Date.now()}`;
}

function quitarPassword(usuario) {
  const { password, ...usuarioSinPassword } = usuario;
  return usuarioSinPassword;
}

function obtenerUsuarioDesdeToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');

  if (!token.startsWith('token-')) {
    return null;
  }

  const tokenSinPrefijo = token.replace('token-', '');

  const partes = tokenSinPrefijo.split('-');

  if (partes.length < 2) {
    return null;
  }

  const timestamp = partes.pop();

  if (!timestamp) {
    return null;
  }

  const userId = partes.join('-');

  return userId;
}

async function middlewareAuth(req, res, next) {
  const userId = obtenerUsuarioDesdeToken(req);

  if (!userId) {
    return res.status(401).json({
      message: 'Token no válido',
    });
  }

  const usuarios = await leerUsuarios();

  const usuario = usuarios.find((item) => item.id === userId);

  if (!usuario || !usuario.activo) {
    return res.status(401).json({
      message: 'Usuario no autorizado',
    });
  }

  req.usuario = usuario;

  next();
}

function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({
        message: 'Usuario no autenticado',
      });
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
      });
    }

    next();
  };
}

async function leerRiesgos() {
  try {
    const existe = await fs.pathExists(riesgosPath);

    if (!existe) {
      await fs.writeJson(riesgosPath, []);
      return [];
    }

    return await fs.readJson(riesgosPath);
  } catch (error) {
    console.log('Error al leer riesgos:', error);
    return [];
  }
}

async function guardarRiesgos(riesgos) {
  try {
    await fs.writeJson(riesgosPath, riesgos, {
      spaces: 2,
    });
  } catch (error) {
    console.log('Error al guardar riesgos:', error);
    throw error;
  }
}

async function leerUsuarios() {
  try {
    const existe = await fs.pathExists(usuariosPath);

    if (!existe) {
      await fs.writeJson(usuariosPath, []);
      return [];
    }

    return await fs.readJson(usuariosPath);
  } catch (error) {
    console.log('Error al leer usuarios:', error);
    return [];
  }
}

async function guardarUsuarios(usuarios) {
  try {
    await fs.writeJson(usuariosPath, usuarios, {
      spaces: 2,
    });
  } catch (error) {
    console.log('Error al guardar usuarios:', error);
    throw error;
  }
}

app.get('/', (req, res) => {
  res.json({
    mensaje: 'Backend SSO Gestion de Riesgos funcionando',
    version: '1.0.0',
  });
});

app.get('/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sso-gestion-riesgos-api',
  });
});

app.post('/v1/auth/login', async (req, res) => {
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({
      message: 'Correo y contraseña son obligatorios',
    });
  }

  const usuarios = await leerUsuarios();

  const usuario = usuarios.find(
    (item) =>
      item.correo.toLowerCase() === String(correo).toLowerCase() &&
      item.password === password &&
      item.activo
  );

  if (!usuario) {
    return res.status(401).json({
      message: 'Credenciales inválidas',
    });
  }

  const usuarioSinPassword = quitarPassword(usuario);

  return res.json({
    user: usuarioSinPassword,
    access_token: generarToken(usuario),
  });
});

app.get(
  '/v1/users',
  middlewareAuth,
  permitirRoles('Administrador'),
  async (req, res) => {
    const usuarios = await leerUsuarios();

    const usuariosSinPassword = usuarios.map(quitarPassword);

    res.json(usuariosSinPassword);
  }
);

app.post(
  '/v1/users',
  middlewareAuth,
  permitirRoles('Administrador'),
  async (req, res) => {
    const {
      nombre,
      correo,
      password,
      rol,
      empresa,
      faena,
      activo,
    } = req.body;

    if (!nombre || !correo || !password || !rol) {
      return res.status(400).json({
        message: 'Faltan datos obligatorios del usuario',
      });
    }

    const usuarios = await leerUsuarios();

    const existeCorreo = usuarios.some(
      (item) => item.correo.toLowerCase() === correo.toLowerCase()
    );

    if (existeCorreo) {
      return res.status(400).json({
        message: 'Ya existe un usuario con ese correo',
      });
    }

    const nuevoUsuario = {
      id: Date.now().toString(),
      nombre,
      correo,
      password,
      rol,
      empresa: empresa || '',
      faena: faena || '',
      activo: activo ?? true,
    };

    usuarios.push(nuevoUsuario);

    await guardarUsuarios(usuarios);

    res.status(201).json(quitarPassword(nuevoUsuario));
  }
);

app.patch(
  '/v1/users/:id',
  middlewareAuth,
  permitirRoles('Administrador'),
  async (req, res) => {
    const { id } = req.params;

    const usuarios = await leerUsuarios();

    const usuario = usuarios.find((item) => item.id === id);

    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado',
      });
    }

    const {
      nombre,
      rol,
      empresa,
      faena,
      activo,
    } = req.body;

    if (nombre !== undefined) usuario.nombre = nombre;
    if (rol !== undefined) usuario.rol = rol;
    if (empresa !== undefined) usuario.empresa = empresa;
    if (faena !== undefined) usuario.faena = faena;
    if (activo !== undefined) usuario.activo = activo;

    await guardarUsuarios(usuarios);

    res.json(quitarPassword(usuario));
  }
);

app.get(
  '/v1/incidents',
  middlewareAuth,
  async (req, res) => {
    const riesgos = await leerRiesgos();

    res.json(riesgos);
  }
);

app.post(
  '/v1/incidents',
  middlewareAuth,
  async (req, res) => {
    try {
      console.log('================================');
      console.log('Creando riesgo...');
      console.log(
        'Tamaño evidencias:',
        JSON.stringify(req.body.evidencias || []).length
      );

      const {
        titulo,
        descripcion,
        categoria,
        nivel,
        estado,
        fecha,
        evidencias,
        reportadoPor,
      } = req.body;

      if (!titulo || !descripcion || !categoria || !nivel || !reportadoPor) {
        return res.status(400).json({
          message: 'Faltan datos obligatorios para registrar el riesgo',
        });
      }

      const riesgos = await leerRiesgos();

      const nuevoRiesgo = {
        id: Date.now().toString(),
        titulo,
        descripcion,
        categoria,
        nivel,
        estado: estado || 'Pendiente',
        fecha: fecha || new Date().toLocaleDateString('es-CL'),
        evidencias: Array.isArray(evidencias) ? evidencias : [],
        reportadoPor,
      };

      riesgos.unshift(nuevoRiesgo);

      await guardarRiesgos(riesgos);

      console.log('Riesgo guardado correctamente');

      res.status(201).json(nuevoRiesgo);

    } catch (error) {
      console.log('ERROR AL CREAR RIESGO');
      console.log(error);

      res.status(500).json({
        message: 'Error interno al guardar riesgo',
      });
    }
  }
);

app.get(
  '/v1/incidents/:id',
  middlewareAuth,
  async (req, res) => {
    const { id } = req.params;

    const riesgos = await leerRiesgos();

    const riesgo = riesgos.find((item) => item.id === id);

    if (!riesgo) {
      return res.status(404).json({
        message: 'Riesgo no encontrado',
      });
    }

    res.json(riesgo);
  }
);

app.patch(
  '/v1/incidents/:id',
  middlewareAuth,
  permitirRoles('Administrador', 'Prevencionista'),
  async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    const riesgos = await leerRiesgos();

    const riesgo = riesgos.find((item) => item.id === id);

    if (!riesgo) {
      return res.status(404).json({
        message: 'Riesgo no encontrado',
      });
    }

    if (estado) {
      const estadosValidos = ['Pendiente', 'En revisión', 'Cerrado'];

      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          message: 'Estado no válido',
        });
      }

      riesgo.estado = estado;
    }

    await guardarRiesgos(riesgos);

    res.json(riesgo);
  }
);

app.delete(
  '/v1/incidents/:id',
  middlewareAuth,
  permitirRoles('Administrador'),
  async (req, res) => {
    const { id } = req.params;

    const riesgos = await leerRiesgos();

    const nuevosRiesgos = riesgos.filter((item) => item.id !== id);

    await guardarRiesgos(nuevosRiesgos);

    res.status(204).send();
  }
);

app.listen(PORT, () => {
  console.log(`Backend SSO Gestion de Riesgos funcionando en http://localhost:${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/v1`);
});