const { Storage } = require("@google-cloud/storage")
const Sharp = require("sharp")
//El receptor de ficheros
const multer = require("multer")
const ObjectId = require("mongoose").Types.ObjectId

const parametros = {
  GCLOUD_PROJECT_ID: "",
  GCLOUD_APPLICATION_CREDENTIALS: "",
  GCLOUD_STORAGE_BUCKET_URL: "",
}

var storage = null
var bucket = null
module.exports.config = function (param = param) {
  Object.keys(parametros).forEach(x => {
    if (!param[x])
      throw new Error(msj("[ easy-images ]", `Parametro no definido: ${x}`))
  })
  Object.assign(parametros, param)

  storage = new Storage({
    projectId: parametros.GCLOUD_PROJECT_ID,
    credentials: JSON.parse(parametros.GCLOUD_APPLICATION_CREDENTIALS),
  })
  bucket = storage.bucket(parametros.GCLOUD_STORAGE_BUCKET_URL)
}

// Filtro para multer para las extenciones deseadas.
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png"
  ) {
    cb(null, true)
  } else {
    cb(`La imagen ${file.originalname} no es de tipo jpg/jpeg or png`, false)
  }
}
/**
 * Con la ayuda de multer prepara un middleware para la recepcion de una
 * imagen que no sea mayor 5MB
 *
 * @param {*} buffer
 * @returns Retorna un un objeto de multer con el que se pondran las opciones.
 */
module.exports.recibirImagen = multer({
  fileFilter,
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, //tamaño < 5 MB
  },
})

/**
 * Crea un middleware de redimencion para reducir el tamaño de la imagen a max
 * 1200 px por lado y calidad 80
 * @param {*} req
 * @param {*} params
 * @param {*} next
 */
module.exports.redimencionarMiddleware = (req, params, next) => {
  // Con este middleware redimiensionamos el tamaño de
  // imagen para que no mida mas de 1000
  Sharp(req.file.buffer)
    // El maximo tamaño horizontal de las imagenes debe ser 1200
    .resize(1200, 1200, { withoutEnlargement: true, fit: Sharp.fit.inside })
    .jpeg({ quality: 80 })
    .toBuffer()
    .then(data => {
      req.file.buffer = data
      return next()
    })
    .catch(err => next(err))
}
/**
 * Elimina una imagen de la nube y retorna una promesa con la respuesta.
 * @param {*} nombre
 */
module.exports.eliminarImagenDeBucket = function (nombre) {
  const file = bucket.file(nombre)
  return file.delete()
}

/**
 *Sube una imagen al google cloud-storage de firebase. Solo hay
 * que pasarle el buffer de la imagen que se quiere subir.
 *
 * @param {*} buffer
 * @returns Retorna la url publica de la imagen en el bucket de google
 * para guardarlo en nuestra imagen
 */
module.exports.subirImagen = function (file) {
  if (!bucket)
    throw new Error(msj("[ easy-images ]", `Parametro no definido: ${x}`))

  return new Promise((resolve, reject) => {
    // Generamos un nuevo nombre con el object is
    const nuevoNombre = ObjectId() + ""
    // Creamos el nuevo archivo para subir con el nombre que queremos.
    const blob = bucket.file(nuevoNombre)
    const blobStream = blob.createWriteStream({
      metadata: {
        // Important: You need to pass the file mimetype as metadata to createWriteStream() otherwise your file won’t be stored in the proper format and won’t be readable.
        contentType: file.mimetype,
      },
    })

    // If all is good and done
    blobStream.on("finish", () => {
      // Assemble the file public URL
      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${
        bucket.name
      }/o/${encodeURI(blob.name)}?alt=media`
      // Return the file name and its public URL
      // for you to store in your own database
      resolve({ publicUrl, nuevoNombre })
    })

    blobStream.end(file.buffer)
    // If there's an error
    blobStream.on("error", err => reject(err))
  })
}

module.exports.bucket = bucket

function msj(textRed, text) {
  return `\x1b[0m\x1b[31m\x1b[40m${textRed}\x1b[0m${text}`
}
