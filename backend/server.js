const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Equipos por categoría
const EQUIPOS_POR_CATEGORIA = {
  'Electricidad': 'Equipo Eléctrico',
  'Orden y limpieza': 'Equipo Limpieza',
  'EPP': 'Equipo EPP',
  'Herramientas': 'Equipo Herramientas',
  'Altura': 'Equipo Altura',
  'Químicos': 'Equipo Químico',
  'Incendio': 'Equipo Emergencias',
  'Tránsito': 'Equipo Tránsito',
  'Maquinaria': 'Equipo Maquinaria',
  'Sustancias peligrosas': 'Equipo Químico',
  'Otro': 'Equipo General',
};

async function inicializarDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        correo TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        rol TEXT NOT NULL,
        empresa TEXT DEFAULT '',
        faena TEXT DEFAULT '',
        activo BOOLEAN DEFAULT true
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS riesgos (
        id TEXT PRIMARY KEY,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        categoria TEXT,
        nivel INTEGER,
        estado TEXT DEFAULT 'Pendiente',
        fecha TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        evidencias JSONB DEFAULT '[]',
        reportado_por JSONB,
        equipo_asignado TEXT
      );
    `);

    await pool.query(`
      ALTER TABLE riesgos ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
    `);

    await pool.query(`
      ALTER TABLE riesgos ADD COLUMN IF NOT EXISTS equipo_asignado TEXT;
    `);

    const { rows } = await pool.query('SELECT COUNT(*) FROM usuarios');
    if (parseInt(rows[0].count) === 0) {
      const usuariosDefault = [
        { id: '1', nombre: 'Juan Pérez', correo: 'juan.perez@empresa.cl', password: '1234', rol: 'Trabajador', empresa: 'Empresa', faena: 'Faena Norte' },
        { id: '2', nombre: 'María González', correo: 'maria.gonzalez@empresa.cl', password: '1234', rol: 'Supervisor', empresa: 'Empresa', faena: 'Faena Norte' },
        { id: '3', nombre: 'Carlos Muñoz', correo: 'carlos.munoz@empresa.cl', password: '1234', rol: 'Prevencionista', empresa: 'Empresa', faena: 'Casa Matriz' },
        { id: '4', nombre: 'Ana Rojas', correo: 'ana.rojas@empresa.cl', password: '1234', rol: 'Administrador', empresa: 'Empresa', faena: 'Casa Matriz' },
      ];

      for (const u of usuariosDefault) {
        await pool.query(
          `INSERT INTO usuarios (id, nombre, correo, password, rol, empresa, faena, activo)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)
           ON CONFLICT (correo) DO NOTHING`,
          [u.id, u.nombre, u.correo, u.password, u.rol, u.empresa, u.faena]
        );
      }
      console.log('Usuarios por defecto creados');
    }

    console.log('Base de datos inicializada correctamente');
  } catch (error) {
    console.log('Error al inicializar DB:', error);
  }
}

function generarToken(usuario) {
  return `token-${usuario.id}-${Date.now()}`;
}

function quitarPassword(usuario) {
  const { password, ...usuarioSinPassword } = usuario;
  return usuarioSinPassword;
}

function obtenerUsuarioDesdeToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '');
  if (!token.startsWith('token-')) return null;
  const tokenSinPrefijo = token.replace('token-', '');
  const partes = tokenSinPrefijo.split('-');
  if (partes.length < 2) return null;
  const timestamp = partes.pop();
  if (!timestamp) return null;
  return partes.join('-');
}

async function middlewareAuth(req, res, next) {
  const userId = obtenerUsuarioDesdeToken(req);
  if (!userId) return res.status(401).json({ message: 'Token no válido' });
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [userId]);
  const usuario = rows[0];
  if (!usuario || !usuario.activo) return res.status(401).json({ message: 'Usuario no autorizado' });
  req.usuario = usuario;
  next();
}

function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) return res.status(401).json({ message: 'Usuario no autenticado' });
    if (!rolesPermitidos.includes(req.usuario.rol)) return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
    next();
  };
}

app.get('/', (req, res) => {
  res.json({ mensaje: 'Backend SSO Gestion de Riesgos funcionando', version: '1.0.0' });
});

app.get('/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'sso-gestion-riesgos-api' });
});

// Endpoint para obtener equipos por categoría
app.get('/v1/equipos', middlewareAuth, (req, res) => {
  res.json(EQUIPOS_POR_CATEGORIA);
});

app.post('/v1/auth/login', async (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password) return res.status(400).json({ message: 'Correo y contraseña son obligatorios' });
  const { rows } = await pool.query(
    'SELECT * FROM usuarios WHERE LOWER(correo) = LOWER($1) AND password = $2 AND activo = true',
    [correo, password]
  );
  const usuario = rows[0];
  if (!usuario) return res.status(401).json({ message: 'Credenciales inválidas' });
  return res.json({ user: quitarPassword(usuario), access_token: generarToken(usuario) });
});

app.get('/v1/users', middlewareAuth, permitirRoles('Administrador'), async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM usuarios');
  res.json(rows.map(quitarPassword));
});

app.post('/v1/users', middlewareAuth, permitirRoles('Administrador'), async (req, res) => {
  const { nombre, correo, password, rol, empresa, faena, activo } = req.body;
  if (!nombre || !correo || !password || !rol) return res.status(400).json({ message: 'Faltan datos obligatorios del usuario' });
  const existe = await pool.query('SELECT id FROM usuarios WHERE LOWER(correo) = LOWER($1)', [correo]);
  if (existe.rows.length > 0) return res.status(400).json({ message: 'Ya existe un usuario con ese correo' });
  const id = Date.now().toString();
  await pool.query(
    'INSERT INTO usuarios (id, nombre, correo, password, rol, empresa, faena, activo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [id, nombre, correo, password, rol, empresa || '', faena || '', activo ?? true]
  );
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  res.status(201).json(quitarPassword(rows[0]));
});

app.patch('/v1/users/:id', middlewareAuth, permitirRoles('Administrador'), async (req, res) => {
  const { id } = req.params;
  const { nombre, rol, empresa, faena, activo } = req.body;
  const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'Usuario no encontrado' });
  await pool.query(
    `UPDATE usuarios SET nombre = COALESCE($1, nombre), rol = COALESCE($2, rol), empresa = COALESCE($3, empresa), faena = COALESCE($4, faena), activo = COALESCE($5, activo) WHERE id = $6`,
    [nombre, rol, empresa, faena, activo, id]
  );
  const updated = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
  res.json(quitarPassword(updated.rows[0]));
});

// GET incidents — filtrado por rol
app.get('/v1/incidents', middlewareAuth, async (req, res) => {
  const usuario = req.usuario;
  let query;
  let params = [];

  if (usuario.rol === 'Administrador' || usuario.rol === 'Prevencionista') {
    // Ven todos los riesgos
    query = 'SELECT * FROM riesgos ORDER BY id DESC';
  } else {
    // Ven los riesgos de su mismo rol
    query = `
      SELECT r.* FROM riesgos r
      WHERE (r.reportado_por->>'rol') = $1
      ORDER BY r.id DESC
    `;
    params = [usuario.rol];
  }

  const { rows } = await pool.query(query, params);
  res.json(rows.map(r => ({
    id: r.id,
    titulo: r.titulo,
    descripcion: r.descripcion,
    categoria: r.categoria,
    nivel: r.nivel,
    estado: r.estado,
    fecha: r.fecha,
    evidencias: r.evidencias || [],
    reportadoPor: r.reportado_por,
    equipoAsignado: r.equipo_asignado,
  })));
});

app.post('/v1/incidents', middlewareAuth, async (req, res) => {
  try {
    const { titulo, descripcion, categoria, nivel, estado, fecha, evidencias, reportadoPor } = req.body;
    if (!titulo || !descripcion || !categoria || !nivel || !reportadoPor) {
      return res.status(400).json({ message: 'Faltan datos obligatorios para registrar el riesgo' });
    }

    // Asignar equipo automáticamente según categoría
    const equipoAsignado = EQUIPOS_POR_CATEGORIA[categoria] || 'Equipo General';

    const id = Date.now().toString();
    await pool.query(
      'INSERT INTO riesgos (id, titulo, descripcion, categoria, nivel, estado, fecha, evidencias, reportado_por, equipo_asignado, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())',
      [id, titulo, descripcion, categoria, nivel, estado || 'Pendiente', fecha || new Date().toLocaleDateString('es-CL'), JSON.stringify(evidencias || []), JSON.stringify(reportadoPor), equipoAsignado]
    );

    const { rows } = await pool.query('SELECT * FROM riesgos WHERE id = $1', [id]);
    const r = rows[0];
    res.status(201).json({
      id: r.id, titulo: r.titulo, descripcion: r.descripcion,
      categoria: r.categoria, nivel: r.nivel, estado: r.estado,
      fecha: r.fecha, evidencias: r.evidencias || [], reportadoPor: r.reportado_por,
      equipoAsignado: r.equipo_asignado,
    });
  } catch (error) {
    console.log('ERROR AL CREAR RIESGO', error);
    res.status(500).json({ message: 'Error interno al guardar riesgo' });
  }
});

app.get('/v1/incidents/:id', middlewareAuth, async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM riesgos WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: 'Riesgo no encontrado' });
  const r = rows[0];
  res.json({ id: r.id, titulo: r.titulo, descripcion: r.descripcion, categoria: r.categoria, nivel: r.nivel, estado: r.estado, fecha: r.fecha, evidencias: r.evidencias || [], reportadoPor: r.reportado_por, equipoAsignado: r.equipo_asignado });
});

app.patch('/v1/incidents/:id', middlewareAuth, permitirRoles('Administrador', 'Prevencionista'), async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  const { rows } = await pool.query('SELECT * FROM riesgos WHERE id = $1', [id]);
  if (!rows[0]) return res.status(404).json({ message: 'Riesgo no encontrado' });
  if (estado) {
    const estadosValidos = ['Pendiente', 'En revisión', 'Cerrado'];
    if (!estadosValidos.includes(estado)) return res.status(400).json({ message: 'Estado no válido' });
    await pool.query('UPDATE riesgos SET estado = $1 WHERE id = $2', [estado, id]);
  }
  const updated = await pool.query('SELECT * FROM riesgos WHERE id = $1', [id]);
  const r = updated.rows[0];
  res.json({ id: r.id, titulo: r.titulo, descripcion: r.descripcion, categoria: r.categoria, nivel: r.nivel, estado: r.estado, fecha: r.fecha, evidencias: r.evidencias || [], reportadoPor: r.reportado_por, equipoAsignado: r.equipo_asignado });
});

app.delete('/v1/incidents/:id', middlewareAuth, permitirRoles('Administrador'), async (req, res) => {
  await pool.query('DELETE FROM riesgos WHERE id = $1', [req.params.id]);
  res.status(204).send();
});

// Endpoint stats
app.get('/v1/stats', middlewareAuth, async (req, res) => {
  try {
    const { rows: porMes } = await pool.query(`
      SELECT
        TO_CHAR(created_at, 'YYYY-MM') as mes,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE nivel >= 4) as criticos,
        COUNT(*) FILTER (WHERE estado = 'Cerrado') as cerrados
      FROM riesgos
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY mes
      ORDER BY mes ASC
    `);

    let tasaCrecimiento = 0;
    if (porMes.length >= 2) {
      const mesAnterior = parseInt(porMes[porMes.length - 2].total);
      const mesActual = parseInt(porMes[porMes.length - 1].total);
      if (mesAnterior > 0) {
        tasaCrecimiento = ((mesActual - mesAnterior) / mesAnterior) * 100;
      }
    }

    const { rows: totales } = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE nivel >= 4) as criticos,
        COUNT(*) FILTER (WHERE estado = 'Pendiente') as pendientes,
        COUNT(*) FILTER (WHERE estado = 'Cerrado') as cerrados,
        ROUND(AVG(nivel)::numeric, 1) as nivel_promedio
      FROM riesgos
    `);

    const totalActual = parseInt(totales[0].total);
    const proyeccion30 = Math.round(totalActual * (1 + tasaCrecimiento / 100));

    // Por equipo
    const { rows: porEquipo } = await pool.query(`
      SELECT equipo_asignado, COUNT(*) as total,
        COUNT(*) FILTER (WHERE estado = 'Cerrado') as cerrados
      FROM riesgos
      WHERE equipo_asignado IS NOT NULL
      GROUP BY equipo_asignado
      ORDER BY total DESC
    `);

    res.json({
      porMes,
      totales: totales[0],
      tasaCrecimiento: Math.round(tasaCrecimiento),
      proyeccion30: proyeccion30 > 0 ? proyeccion30 : totalActual,
      porEquipo,
    });
  } catch (error) {
    console.log('Error en stats:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

app.listen(PORT, async () => {
  console.log(`Backend SSO Gestion de Riesgos funcionando en http://localhost:${PORT}`);
  console.log(`API disponible en http://localhost:${PORT}/v1`);
  await inicializarDB();
});