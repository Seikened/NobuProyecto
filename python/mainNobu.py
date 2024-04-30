from selenium import webdriver
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import NoSuchElementException
from regularExpression import datos_descripcion
import os
import platform
import json


#========================= CLASES =========================#
class BaulTareas:
    def __init__(self):
        self.lista_tareas = []
    
    def agregar_tarea(self,tarea):
        self.lista_tareas.append(tarea)
    
    def getTarea(self, idTarea):
        # Comprueba si idTarea está dentro de los límites de la lista
        if 0 <= idTarea < len(self.lista_tareas):
            tarea = self.lista_tareas[idTarea]
            print(tarea)
            return tarea
        else:
            # Maneja el caso donde idTarea no es un índice válido
            print(f"No se encontró la tarea con ID {idTarea + 1}")  # +1 para ajustar el índice al ID original
            return None
    
    def getTareas(self):
        return self.lista_tareas
    
    def cantidadTareas(self):
        return len(self.lista_tareas)
    
    def __str__(self):
        for tarea in self.lista_tareas:
            print(tarea)
        return ""



class Tarea:
    idTarea = 0
    
    def __init__(self, titulo, descripcion, fecha_entrega,materia,pie_pagina, evento_crudo = None):
        self.evento_crudo = evento_crudo
        self.titulo = titulo
        self.descripcion = descripcion
        self.fecha_entrega, self.dias_restantes, self.horas_restantes, self.minutos_restantes, self.segundos_restantes = fecha_entrega
        self.materia = materia
        self.estado = "DESCONOCIDO"
        self.pie_pagina = pie_pagina
        self.__normalizarVariables()
        Tarea.idTarea += 1
        self.idTarea = Tarea.idTarea
        
    def __normalizarVariables(self):
        self.titulo = self.titulo.strip().upper()
        self.descripcion = self.descripcion.strip()
        self.materia = self.materia.strip().upper()
        self.pie_pagina = self.pie_pagina.strip().lower()
        match self.pie_pagina:
            case 'añadir envío':
                self.estado = "TAREA PENDIENTE⌛️"
            case 'ir a la actividad':
                self.estado = "TAREA FINALIZADA✅"
            case _:
                self.estado = "ESTADO DESCONOCIDO ❓"
        
    def entregarTarea(self):
        if self.pie_pagina == 'añadir envío':
            enlace_envio = self.evento_crudo.find_element(By.CSS_SELECTOR, 'a.card-link')
            enlace_envio.click()

    def __str__(self):
        str_repr = "\n" * 2
        str_repr += "=" * 100 + "\n"
        # ID y Evento
        str_repr += f"🆔 ID: {self.idTarea}\n"
        str_repr += f"⏹️ Evento: {self.titulo.upper()}\n"
        # Fecha y Tiempo Restante
        str_repr += f"📆 Fecha: {self.fecha_entrega}\n"
        str_repr += (f"⏳ Días restantes: {self.dias_restantes}, Horas restantes: {self.horas_restantes}, Minutos restantes: {self.minutos_restantes}, Segundos restantes: {self.segundos_restantes}\n")
        # Descripción, Materia y Estado
        str_repr += f"📝 Descripción: \n{self.descripcion}\n"
        str_repr += f"📚 Materia: {self.materia.upper()}\n"
        str_repr += f"🔍 Estado: {self.estado}\n"
        return str_repr


# Clase para configurar el navegador
class ConfiguracionNavegador:
    def __init__(self):
        self.link_visit = 'https://cursos.iberoleon.mx/online/login/index.php'
        self.chrome_options = Options()
        self.chrome_options.add_argument("--headless")  # Para ejecutar en modo sin cabeza (headless)

        # Aquí utilizamos webdriver-manager para gestionar el driver
        self.chrome_service = Service(executable_path=ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=self.chrome_service, options=self.chrome_options)
        self.driver.get(self.link_visit)

class IniciarSesion:
    def __init__(self,username,password,driver):
        self.username = username
        self.password = password
        self.driver = driver
        self.driver.find_element(By.NAME, 'username').send_keys(self.username)
        self.driver.find_element(By.NAME, 'password').send_keys(self.password)
        self.login_button = WebDriverWait(self.driver, 10).until(EC.element_to_be_clickable((By.ID, "loginbtn")))
        self.login_button.click()


#========================= FIN DE CLASES =========================#


def evento_proximo(eventos_proximos):
    eventos = []
    for evento in eventos_proximos:
        titulo_evento = evento.find_element(By.CSS_SELECTOR, '.card-header').text
        descripcion_evento = evento.find_element(By.CSS_SELECTOR, '.card-body').text
        try:
            pie_evento = evento.find_element(By.CSS_SELECTOR, '.card-footer').text
        except NoSuchElementException:
            pie_evento = "Pie no disponible"  # O cualquier otro valor predeterminado que prefieras
        eventos.append((titulo_evento, descripcion_evento, pie_evento))
    return eventos

def obtener_ruta_documentos(): 
    # Detectar el sistema operativo
    sistema = platform.system()

    # Para Windows
    if sistema == 'Windows':
        return os.path.join(os.environ['USERPROFILE'], 'Documents'), sistema
    
    # Para macOS
    elif sistema == 'Darwin':
        return os.path.join(os.path.expanduser('~'), 'Documents'),sistema
    
    # Para Linux u otros sistemas, puedes ajustarlo según sea necesario
    else:
        return os.path.join(os.path.expanduser('~'), 'Documents'),sistema


def crear_carpetas(path_document_system, nombre_carpeta="MATERIAS_IBERO"):
    ruta = os.path.join(path_document_system,"TAREAS_"+nombre_carpeta)
    os.makedirs(ruta,exist_ok = True)
#========================= FIN DE FUNCIONES =========================#
def main():
    #==================================== PARTE 1 ====================================#
    # Incializar las clases
    baulDeTareas = BaulTareas()


    driver = ConfiguracionNavegador().driver
    #==================================== FIN DE PARTE 1 ====================================#

    #==================================== PARTE 2 ====================================#
    # Parte 2: Inicio de sesión
    username = '192488-7'
    password =  'Ftry2131*'#input("Introduce tu contraseña: ")
    nombreArchivo = 'Investigacion sobre Logaritmos y Antilogaritmos.pdf' #'FERNANDO_TAREAS.txt'
    numeroTarea = 4

    IniciarSesion(username, password,driver)


    # Vamos a verificar si hay archivos existiendo en la carpeta de documentos
    #==================================== FIN DE PARTE 2 ====================================#

    #==================================== PARTE 3 ====================================#
    # Parte 3: Navegación a la página del calendario y selección del evento
    #print("Navegando a la página del calendario...") 

    driver.get('https://cursos.iberoleon.mx/online/calendar/view.php') # esto  navega a la página que le pongas como argumento
    WebDriverWait(driver, 10).until(EC.visibility_of_element_located((By.CLASS_NAME, "eventlist")))
    #Obtener los eventos próximos
    eventos_proximos = driver.find_elements(By.CSS_SELECTOR, ".eventlist .card.rounded")

    # Traer los eventos próximos pero tratados
    eventos = evento_proximo(eventos_proximos)

    # Meter en la clase las tareas
    for evento_tratado,evento_sin_tratar in zip(eventos, eventos_proximos):
        titulo_evento, descripcion_evento, pie_evento = evento_tratado
        fecha_and_tiemporestante,descipcion,materia = datos_descripcion(descripcion_evento)
        tarea = Tarea(titulo_evento,descipcion,fecha_and_tiemporestante,materia,pie_evento,evento_sin_tratar)
        baulDeTareas.agregar_tarea(tarea)
    #==================================== FIN DE PARTE 3 ====================================#

    

    #==================================== PARTE 5 ====================================#
    # Parte 5: Finalización y cierre
    driver.quit()
    
    tareas_para_enviar = []
    for tarea in baulDeTareas.getTareas():
        fecha_entrega_str = tarea.fecha_entrega.strftime("%Y-%m-%d %H:%M:%S")
        # Convertir cada tarea a un diccionario
        tareas_para_enviar.append({
            "idTarea": tarea.idTarea,
            "titulo": tarea.titulo,
            "fecha_entrega": fecha_entrega_str,  # Aquí está el cambio
            "dias_restantes": tarea.dias_restantes,
            "horas_restantes": tarea.horas_restantes,
            "minutos_restantes": tarea.minutos_restantes,
            "segundos_restantes": tarea.segundos_restantes,
            "descripcion": tarea.descripcion,
            "materia": tarea.materia,
            "estado": tarea.estado
        })

    # Convertir la lista de tareas a JSON y imprimir
    print(json.dumps(tareas_para_enviar))

    return "Fin del programa"

if __name__ == "__main__":
    main()