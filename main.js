const { app, BrowserWindow, ipcMain , dialog} = require('electron');
const { setMainMenu} = require('./scripts/menu.js');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');


const username = '192488-7';
const password = 'Ftry2131*';

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

ipcMain.on('solicitar-tareas', (event) => {
  console.log('Solicitando ejecución de script de Python...');
  
  exec(`"${pythonExecutable}" "${pythonScriptPathNobu}"`, (error, stdout, stderr) => {
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
    
    // Aquí se procesa la salida del script de Python para encontrar la línea que contiene el JSON
    const lines = stdout.split('\n'); // Divide la salida en líneas
    const jsonLines = lines.filter(line => line.trim().startsWith('[') && line.trim().endsWith(']')); // Filtra solo las líneas que parecen ser JSON
    
    if (jsonLines.length > 0) {
      console.log('JSON Lines:', jsonLines); // Imprime para verificar
      jsonLines.forEach(jsonLine => {
        event.reply('entregar-tareas', jsonLine.trim()); // Envía solo las líneas de JSON, asegurándose de que están limpias de espacios en blanco
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




ipcMain.on('entregar-tarea', (event, { idTarea, filePaths }) => {
  // Construye el comando para ejecutar el script de Python
  const command = `"${pythonExecutable}" "${pythonScriptPatEntrega}" ${idTarea} "${filePaths[0]}" --username "${username}" --password "${password}"`;

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
    exec(`"${pythonExecutable}" "${pythonScriptPathNobu}"`, (error, stdout, stderr) => {
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
