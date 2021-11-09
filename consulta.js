const {Pool} = require("pg");
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  password: "",
  database: "skatepark",
  port: 5432,
});

async function nuevoUsuario(email, nombre, password, anos_experiencia, especialidad, foto){
  const result = await pool.query(`INSERT INTO skaters (email, nombre, password, anos_experiencia, especialidad, foto, estado) values ('${email}', '${nombre}', '${password}','${anos_experiencia}','${especialidad}','${foto}', false) RETURNING *`);
  const usuario = result.rows[0];
  return usuario;
};

async function getAdmin(){
  const result = await pool.query(`SELECT * FROM skaters`);
  return result.rows;
};

async function setUsuarioStatus(id, estado){
  const result = await pool.query(`UPDATE skaters SET estado = ${estado} WHERE id = ${id} RETURNING *`);
  const usuario = result.rows[0];
  return usuario;
};

async function getUsuario(email){
  //elimine el password, por tema de seguridad.
  const result = await pool.query(`SELECT * FROM skaters WHERE email = '${email}'`);
  return result.rows[0]
};

async function putDatos(newDatos){
  //let query = `;
  //if(newDatos.nombre) query += nombre = '${newDatos.nombre}',
  //if(newDatos.password) query += password = '${newDatos.password}',
  
  const query = Object.keys(newDatos).map(nameKey =>  newDatos[nameKey] ? `${nameKey} = '${newDatos[nameKey]}'` : '' ).filter(el => el).join(', ')
  
  const result = await pool.query(`UPDATE skaters SET ${query} WHERE email = '${newDatos.email}' RETURNING nombre, email;`)
  const usuario = result.rows[0];
  return usuario
};

async function deleteDatos(email){
  const result = await pool.query(`DELETE FROM skaters WHERE email = '${email}' RETURNING nombre, email, foto;`);
  return result.rows[0];
};

module.exports = {nuevoUsuario, getUsuario, getAdmin, setUsuarioStatus, putDatos, deleteDatos}