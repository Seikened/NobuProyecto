// renderer.js
const { ipcRenderer } = require('electron');


let observer = new IntersectionObserver((entries) => {
entries.forEach(entry => {
    if (entry.isIntersecting) {
    entry.target.classList.add('visible');
    observer.unobserve(entry.target); // Opcional: Deja de observar una vez visible
    }
});
}, {
threshold: 0.1 // Se activará cuando el 10% de la tarea esté visible
});


// Función para agregar las tareas al DOM
function mostrarTareas(tareas) {
    const contenedorTareas = document.getElementById('container-tareas');
    contenedorTareas.textContent = ''; // Limpiar el contenedor

    tareas.forEach(tarea => {
        const tareaDiv = document.createElement('div');
        tareaDiv.className = 'tarea';
        tareaDiv.innerHTML = `
            <div class="tarea__id">🆔 ID: ${tarea.idTarea}</div>
            <div class="tarea__evento">📅 ${tarea.titulo}</div>
            <div class="tarea__fecha">📆 Fecha: ${tarea.fecha_entrega}</div>
            <table class="tiempo__restante">
                <tr>
                    <th>🗓️ Días</th>
                    <th>⏰ Horas</th>
                    <th>⏳ Minutos</th>
                </tr>
                <tr>
                    <td class="tarea__dias">-</td>
                    <td class="tarea__horas">-</td>
                    <td class="tarea__minutos">-</td>
                </tr>
            </table>
            <div class="tarea__descripcion">📝 Descripción: ${tarea.descripcion}</div>
            <div class="tarea__materia">📚 Materia: ${tarea.materia}</div>
            ${verificar_tarea(tarea.idTarea, tarea.estado)}

        `;
        
        contenedorTareas.appendChild(tareaDiv);
        const botonEntregar = tareaDiv.querySelector('.estado-tarea-pendiente');
        if (botonEntregar) {
            botonEntregar.addEventListener('click', () => entregarTarea(tarea.idTarea));
        }

        // Observa la tarea para la animación
        observer.observe(tareaDiv);
        // Actualiza el tiempo restante cada segundo
        const fechaEntrega = new Date(tarea.fecha_entrega);
        const intervalId = setInterval(() => {
            actualizarTiempoRestante(tareaDiv, fechaEntrega, intervalId);
        }, 1000);
        actualizarTiempoRestante(tareaDiv, fechaEntrega, intervalId); // Actualiza inmediatamente sin esperar el primer intervalo

        // Asignación de event listeners para botones generados por verificar_tarea
        if (tarea.estado === "PENDIENTE") {
            const botonEntregar = tareaDiv.querySelector('.estado-tarea-pendiente');
            if (botonEntregar) {
            botonEntregar.addEventListener('click', () => entregarTarea(tarea.idTarea));
            }
        }
    });
}

function actualizarTiempoRestante(tareaDiv, fechaEntrega, intervalId) {
    const ahora = new Date();
    let diferencia = fechaEntrega - ahora;

    if (diferencia <= 0) {
        clearInterval(intervalId);
        tareaDiv.querySelector('.tarea__dias').textContent = '0';
        tareaDiv.querySelector('.tarea__horas').textContent = '0';
        tareaDiv.querySelector('.tarea__minutos').textContent = '0';
    } else {
        const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
        diferencia -= dias * (1000 * 60 * 60 * 24);
        const horas = Math.floor(diferencia / (1000 * 60 * 60));
        diferencia -= horas * (1000 * 60 * 60);
        const minutos = Math.floor(diferencia / (1000 * 60));

        tareaDiv.querySelector('.tarea__dias').textContent = `${dias}`;
        tareaDiv.querySelector('.tarea__horas').textContent = `${horas}`;
        tareaDiv.querySelector('.tarea__minutos').textContent = `${minutos}`;
    }
}



// Login
let usuarioActual = {
    username: '',
    password: '',
    isAuthenticated: false
};

document.getElementById('pre-registro-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username && password) { // Simple verificación de llenado
        usuarioActual.username = username;
        usuarioActual.password = password;
        usuarioActual.isAuthenticated = true; // Marcar como autenticado

        ipcRenderer.send('pre-registro', usuarioActual); 

        console.log(`Pre-registro con usuario: ${username}`);
        document.getElementById('obtener-tareas').classList.remove('hidden');
        document.getElementById('container-tareas').classList.remove('hidden');
    } else {
        console.log("Debe llenar ambos campos, usuario y contraseña.");
    }
});




// Escuchar el evento 'entregar-tareas' del proceso principal
ipcRenderer.on('entregar-tareas', (event, data) => {
    console.log('Datos recibidos con éxito:');
    if(usuarioActual.isAuthenticated){
        if (!data.trim()) {
            console.error("La entrada JSON está vacía");
            // Manejar la situación aquí, como mostrar un mensaje de error al usuario
            return;
        }

        try {
            const tareas = JSON.parse(data);
            if (Array.isArray(tareas)) { // Verifica si tareas es realmente un arreglo
                mostrarTareas(tareas); // Si es un arreglo, procede a mostrar las tareas
            } else {
                throw new Error("La entrada parseada no es un arreglo"); // Lanza un error si no es un arreglo
            }
        } catch (error) {
            console.error("Error parseando JSON:", error);
            // Manejar el error aquí, como mostrar un mensaje de error al usuario
        }
    }
    else{
        console.log('Por favor, registre sus credenciales antes de entregar tareas.');
    }
});


// Evento para entregar la tarea
function entregarTarea(idTarea) {
    ipcRenderer.invoke('dialog:openFile', { idTarea }).then((result) => {
        if (!result.canceled && result.filePaths) {
        console.log(result.filePaths);
        ipcRenderer.send('entregar-tarea', { idTarea, filePaths: result.filePaths, usuario: usuarioActual });
        }
    }).catch(err => {
        console.log(err);
    });
    }



//Evento automatico para cambiar el tema a partir de la hora del sistema
function cambiarTemaAutomatico(){
    const hora = new Date().getHours();
    if (hora >= 18 || hora < 6) {
        document.body.classList.remove('claro');
        document.body.classList.add('oscuro');
        console.log('Tema cambiado a oscuro');
    } else {
        document.body.classList.remove('oscuro');
        document.body.classList.add('claro');
        console.log('Tema cambiado a claro');
    }
}
cambiarTemaAutomatico(); // Cambiar el tema automáticamente al cargar la página
setInterval(cambiarTemaAutomatico, 1000 * 60 * 60); // Cambiar el tema cada hora


// Evento para el botón de cambiar tema manual mente
ipcRenderer.on('cambiar-tema', (event, tema) => {
    if (tema === 'claro') {
        document.body.classList.remove('oscuro');
        document.body.classList.add('claro'); // Asegúrate de que este también se agrega, por consistencia
        console.log('Tema cambiado a claro');
    } else if (tema === 'oscuro') {
        document.body.classList.remove('claro');
        document.body.classList.add('oscuro');
        console.log('Tema cambiado a oscuro');
    }
});



// Evento para el botón de obtener tareas
document.getElementById('obtener-tareas').addEventListener('click', () => {
    if (usuarioActual.isAuthenticated) {
        ipcRenderer.send('solicitar-tareas', usuarioActual);
        console.log('Solicitando tareas...');
    } else {
        console.log('Por favor, registre sus credenciales antes de solicitar tareas.');
    }
});


// Esta función decide qué botón o mensaje mostrar basado en el estado de la tarea.
function verificar_tarea(idTarea, estado) {
    let botonHTML = '';

    if (estado.includes("PENDIENTE")) {
        // Si la tarea está pendiente, genera el botón con la clase estado-tarea-pendiente
        botonHTML = `<button class="estado-tarea-pendiente">Entregar</button>`;
    } else if (estado.includes("FINALIZADA")) {
        // Si la tarea está finalizada, muestra un mensaje o div que lo indique
        botonHTML = `<div class="estado-tarea-finalizada">${estado}</div>`;
    } else {
        // Para cualquier otro estado, muestra un mensaje o div para el estado desconocido
        botonHTML = `<div class="estado-tarea-desconocido">${estado}</div>`;
    }

    return botonHTML;
}
