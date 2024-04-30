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
from mainNobu import *
import argparse



def entregarTarea(idTarea, ruta_archivo, username, password):
    #==================================== PARTE 1 ====================================#
    # Incializar las clases
    baulDeTareas = BaulTareas()

    driver = ConfiguracionNavegador().driver
    #==================================== FIN DE PARTE 1 ====================================#

    #==================================== PARTE 2 ====================================#
    # Parte 2: Inicio de sesión

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

    #==================================== PARTE ENTREGAR TAREA ====================================#
    #Parte 4: Subida de archivos
    tarea_a_entregar = baulDeTareas.getTarea(idTarea - 1)
    tarea_a_entregar.entregarTarea()

    # 1. Hacer clic en el botón que abre la ventana modal
    boton_agregar = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//a[@title='Agregar...'][contains(@class, 'btn-secondary')]"))
    )
    boton_agregar.click()

    # # 3. Enviar la ruta del archivo al input del tipo file
    input_file = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "input[type='file'][name='repo_upload_file']"))
    )
    input_file.send_keys(ruta_archivo) # ruta_archivo

    # # 4. Hacer clic en el botón para subir el archivo
    boton_subir = driver.find_element(By.CSS_SELECTOR, '.fp-upload-btn.btn-primary.btn')
    boton_subir.click()

    boton_guardar_cambios = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "id_submitbutton"))
    )
    boton_guardar_cambios.click()

    #==================================== FIN DE PARTE 4 ====================================#

    #==================================== PARTE 5 ====================================#
    # Parte 5: Finalización y cierre
    driver.quit()

    return "Fin del programa"


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Entregar tarea')
    parser.add_argument('idTarea', type=int, help='El id de la tarea a entregar')
    parser.add_argument('ruta_archivo', type=str, help='La ruta del archivo a entregar')
    parser.add_argument('--username', type=str, help='El nombre de usuario para iniciar sesión')
    parser.add_argument('--password', type=str, help='La contraseña para iniciar sesión')
    args = parser.parse_args()
    entregarTarea(args.idTarea, args.ruta_archivo, args.username, args.password)