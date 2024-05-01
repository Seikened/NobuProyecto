const { app, BrowserWindow, ipcMain , dialog} = require('electron');
const { setMainMenu} = require('./scripts/menu.js');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');




// Determina si la aplicación está empaquetada o en desarrollo
const isPackaged = app.isPackaged;

const pythonScriptPathNobu = isPackaged
  ? path.join(process.resourcesPath, 'app/python/mainNobu.py')
  : path.join(__dirname, 'python', 'mainNobu.py');

const pythonScriptPatEntrega = isPackaged
  ? path.join(process.resourcesPath, 'app/python/entregar_tarea.py')
  : path.join(__dirname, 'python', 'entregar_tarea.py');

// Define la ruta al intérprete de Python del entorno virtual
const pythonExecutable = isPackaged
  ? path.join(process.resourcesPath, 'app/pyDiez/bin/python3')
  : path.join(__dirname, 'pyDiez', 'bin', 'python3');





function createWindow() {
  // Crea una ventana de navegador.
  let mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // Añadido para permitir la integración de Node en el renderizador
    }
  });


  mainWindow.loadFile('index.html');

  // Abre las herramientas de desarrollo (Descomenta la siguiente línea durante la fase de desarrollo)
  //win.webContents.openDevTools();
  setMainMenu(mainWindow);
}



app.whenReady().then(() => {
  createWindow();
});

ipcMain.on('solicitar-tareas', (event, usuario) => {
  console.log('Solicitando ejecución de script de Python con usuario:', usuario.username, ' con', usuario.password);

  // Modifica la línea del comando para incluir el nombre de usuario y la contraseña
  const command = `"${pythonExecutable}" "${pythonScriptPathNobu}" --username "${usuario.username}" --password "${usuario.password}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error ejecutando Python: ${error.message}`);
      event.reply('entregar-tareas', JSON.stringify({ error: error.message }));
      return;
    }
    if (stderr) {
      console.error(`Error en script Python (stderr): ${stderr}`);
      event.reply('entregar-tareas', JSON.stringify({ error: stderr }));
      return;
    }

    console.log('Script de Python ejecutado correctamente, enviando datos al renderizador...');
    
    // Procesa la salida del script de Python para encontrar la línea que contiene el JSON
    const lines = stdout.split('\n');
    const jsonLines = lines.filter(line => line.trim().startsWith('[') && line.trim().endsWith(']'));

    if (jsonLines.length > 0) {
      console.log('JSON Lines:', jsonLines);
      jsonLines.forEach(jsonLine => {
        event.reply('entregar-tareas', jsonLine.trim());
      });
    } else {
      console.error('No se encontró la línea de JSON en la salida del script.');
      event.reply('entregar-tareas', JSON.stringify({ error: 'No se encontró la línea de JSON' }));
    }
  });
});






// Cierra la aplicación cuando todas las ventanas están cerradas.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});


app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});



ipcMain.handle('dialog:openFile', async (event, { idTarea }) => {
  // Usar dialog directamente aquí, en el proceso principal
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile']
  });
  
  // Devolver un objeto con las propiedades cancelado y rutas de archivo
  return {
    canceled,
    filePaths
  };
});


// ACTUALIZAR EL MANEJO DEL RENDERER Y SU ENVIO DE DATOS DEL USUARIO PARA QUE SE ENVIE LA TAREA

ipcMain.on('entregar-tarea', (event, { idTarea, filePaths, usuario }) => {
  // Construye el comando para ejecutar el script de Python
  const command = `"${pythonExecutable}" "${pythonScriptPatEntrega}" ${idTarea} "${filePaths[0]}" --username "${usuario.username}" --password "${usuario.password}"`;
  const pythonProcess = exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error ejecutando Python: ${error.message}`);
      event.reply('tarea-entregada-error', error.message);
      return;
    }
    if (stderr) {
      console.error(`Error en script Python (stderr): ${stderr}`);
      event.reply('tarea-entregada-error', stderr);
      return;
    }

    console.log('Script de Python ejecutado correctamente:', stdout);
    event.reply('tarea-entregada', stdout); // Envía el resultado de vuelta al renderizador

    // Aquí agregas el código para solicitar nuevamente la lista de tareas
    // Asegúrate de incluir el nombre de usuario y la contraseña cuando vuelves a solicitar la lista de tareas
    const refreshCommand = `"${pythonExecutable}" "${pythonScriptPathNobu}" --username "${usuario.username}" --password "${usuario.password}"`;
    exec(refreshCommand, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error al solicitar tareas después de entregar: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`Error en script Python al solicitar tareas después de entregar (stderr): ${stderr}`);
        return;
      }

      // Envía las tareas actualizadas al renderizador
      const lines = stdout.split('\n');
      const jsonLines = lines.filter(line => line.trim().startsWith('[') && line.trim().endsWith(']'));
      if (jsonLines.length > 0) {
        jsonLines.forEach(jsonLine => {
          event.reply('entregar-tareas', jsonLine.trim());
        });
      } else {
        console.error('No se encontró la línea de JSON en la salida del script después de entregar.');
      }
    });
  });

  pythonProcess.on('close', (code) => {
    console.log(`Proceso de Python para entregar tarea finalizado con código ${code}`);
  });
});

// esto es para guardar la sesion del usuario
const sessionFilePath = path.join(app.getPath('userData'), 'session.json');

// Función mejorada para guardar la sesión del usuario
function guardarSesion(usuario) {
    try {
        fs.writeFileSync(sessionFilePath, JSON.stringify(usuario), 'utf-8');
        console.log("Sesión guardada correctamente en:", sessionFilePath);  // Confirma que la sesión se guardó
    } catch (error) {
        console.error("Error al guardar la sesión:", error);  // Muestra errores si la escritura falla
    }
}

// Función mejorada para cargar la sesión del usuario
function cargarSesion() {
    try {
        const data = fs.readFileSync(sessionFilePath, 'utf-8');
        console.log("Sesión cargada correctamente desde:", sessionFilePath);  // Confirma que la sesión se cargó
        return JSON.parse(data);
    } catch (error) {
        console.error("Error al cargar la sesión:", error);  // Maneja errores de lectura
        return null;
    }
}

// Función mejorada para limpiar la sesión del usuario
function limpiarSesion() {
    try {
        if (fs.existsSync(sessionFilePath)) {
            fs.unlinkSync(sessionFilePath);
            console.log("Sesión eliminada correctamente");  // Confirma la eliminación
        }
    } catch (error) {
        console.error("Error al eliminar la sesión:", error);  // Maneja posibles errores de eliminación
    }
}

ipcMain.on('guardar-sesion', (event, usuario) => {
    guardarSesion(usuario);
    console.log("Guardando usuario:", usuario);  // Muestra qué usuario se está guardando
});

ipcMain.on('cargar-sesion', (event) => {
    const usuario = cargarSesion();
    event.reply('sesion-cargada', usuario);
    console.log("Enviando usuario cargado:", usuario);  // Muestra el usuario cargado
});

ipcMain.on('limpiar-sesion', () => {
  limpiarSesion();
});

function limpiarSesion() {
  try {
      if (fs.existsSync(sessionFilePath)) {
          fs.unlinkSync(sessionFilePath);
          console.log("Sesión eliminada correctamente.");
      }
  } catch (error) {
      console.error("Error al eliminar la sesión:", error);
  }
}
