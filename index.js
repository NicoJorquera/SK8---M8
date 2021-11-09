const express = require('express')
const fs = require('fs')
const app = express()
const exphbs = require("express-handlebars");
const expressFileUpload = require("express-fileupload");
const bodyParser = require("body-parser");

//para hashear la password
const bcrypt = require("bcrypt");

const jwt = require('jsonwebtoken');
const secretKey = "Notoy";

const {nuevoUsuario, getUsuario, getAdmin, setUsuarioStatus, putDatos, deleteDatos} = require("./consulta")

app.listen(3000, ()=>{console.log("Puerto Conectado")});
//proveniente del bcrypt
const saltRounds = 10;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/img'));


app.use(expressFileUpload({
  limits: 6500000,
  abortOnLimit: true,
  responseOnLimit: "El tamaño del archivo supera el limite establecido",
}));

app.use("/css", express.static(__dirname + "/node_modules/bootstrap/dist/css"));
app.engine(
  'handlebars',
  exphbs({
    defaultLayout: 'main',
    layoutsDir: `${__dirname}/views/mainLayout`,
    //partialsDir: `${__dirname}/views/components/`,
  })
);

app.set('view engine', 'handlebars');

app.get('/', function(req, res ) {
  res.render('index')
});

app.get('/registro', function(req, res ) {
  res.render('Registro')
});

app.get("/registro/all", async function(req, res){
  const datos = await getAdmin();
  res.json(datos);
});

app.post("/registro", async(req, res) =>{
  const {email, nombre, password, anos_experiencia, especialidad, foto} = req.body;
  //console.log(email, nombre, password, experiencia, especialidad, perfil);
  const newPasword = bcrypt.hashSync(password, saltRounds);
  
  let nombreFoto = "";
  if(req.files.foto){
    req.files.foto.mv(`${__dirname}/public/img/${nombreFoto}`, async(err) =>{
      if(err) return res.status(500).send({
        error: `Ocurrio un error ${err}`,
        code: 500
      });
    });
  }
  try{
    const usuario = await nuevoUsuario(email, nombre, newPasword, anos_experiencia || 0, especialidad, nombreFoto || "")
    res.status(201).send(JSON.stringify(usuario));
    //res.status(201).send(usuario);
  }catch(e){
      res.status(500).send({
      error: `Ha ocurrido un error ${e}`,
      code: 500
    })
  };
});

app.get('/login', function(req, res ) {
  res.render('Login')
});

app.post("/verify", async function (req, res) {
  const { email, password } = req.body;
  const user = await getUsuario(email);
  if (user) {
    if (user.estado) {
      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(400).send({
          error: "La contraseña no coincide",
          code: 400
        });
      }

      const dataUser = { ...user, password: '' }
      const token = jwt.sign(
        {
          exp: Math.floor(Date.now() / 1000) + 10000,
          data: dataUser,
        },
        secretKey
      );
      res.send(token);
    } else {
      res.status(401).send({
        error: "Usuario no validado",
        code: 401
      });
    }
  } else {
    res.status(404).send({
      error: "Usuario no resgistrado",
      code: 404
    });
  }
});

app.get("/admin", async(req, res) =>{
  //res.render("Admin");
  try{
    const usuarios = await getAdmin();
    res.render("Admin", {usuarios}); 
  }catch(e){
    res.status(500).send({
      error: `Ha ocurrido un error ${e}`,
      code: 500
    })
  }
});

app.put("/usuarios", async(req, res) =>{
  const {id, estado} = req.body;
  try{
    const usuario = await setUsuarioStatus(id, estado);
    res.status(200).send(JSON.stringify(usuario));
    //res.status(200).send(usuario);
  }catch(e){
    res.status(500).send({
      error: `Ha ocurrido un error ${e}`,
      code: 500
    })
  };
});

app.get("/Datos", function(req, res){
  const {token} = req.query;
  let jwtDecoded = "";
  try{
    jwtDecoded = jwt.verify(token, secretKey);
  }catch(e){
    console.log(e);
  }
  if(!jwtDecoded){
    return res.status(401).send({
        error: "401 Unauthorized",
        messaege: "Usted no se encuentra autorizado",
        //token_error: err.message,
    });
  }
  res.render("Datos", {... jwtDecoded.data});
  /*jwt.verify(token, secretKey, (err, decoded) =>{
    const {data} = decoded
    const {nombre, email} = data
    err
      ? res.status(401).send(
        res.send({
          error: "401 Unauthorized",
          messaege: "Usted no se encuentra autorizado",
          token_error: err.message,
        })
      )
      : res.render("Datos", {nombre, email});
  })*/
});

app.put('/Datos', async function (req, res) {
  const datosSkater = req.body
  const {email} = jwt.decode(req.query.token).data

  const newPassword = bcrypt.hashSync(datosSkater.password, saltRounds);

  const datosPerfilActualizado = await putDatos({ ...datosSkater, email, password: newPassword })
  res.send(datosPerfilActualizado)
});

app.delete("/eliminarCuenta", (req, res) => {
  const { token } = req.query
  jwt.verify(token, secretKey, async (err, decoded) => {
    if (err) throw ("Error en la consulta")
    const { email } = decoded.data
    const { foto } = await deleteDatos(email)

    if (foto) fs.unlinkSync(path.join(raiz, "public", "img", foto))
    res.status(200).send(email)
  })
})