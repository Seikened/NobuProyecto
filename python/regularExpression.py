import re
from testDate import tiempo_and_restante

def datos_descripcion(descripcion_sin_tratar):
    # Extraer la fecha y hora
    fecha_hora_match = re.search(r"^(.+?),\s*\d{1,2}:\d{2}", descripcion_sin_tratar)
    if fecha_hora_match:
        fecha_hora = fecha_hora_match.group().strip()
    else:
        fecha_hora = "No especificado"

    # Extraer la materia utilizando la función extraer_nombre_materia_v2
    def extraer_nombre_materia_v2(texto_materia):
        patron_materia = r"PR - .+ - (.+)$"
        match = re.search(patron_materia, texto_materia, re.MULTILINE)
        if match:
            return match.group(1).strip()
        else:
            return "No especificado"

    materia = extraer_nombre_materia_v2(descripcion_sin_tratar)

    # Limpiar la descripción
    descripcion = re.sub(r"^(.+?),\s*\d{1,2}:\d{2}", '', descripcion_sin_tratar, count=1).strip()
    descripcion = re.sub(r"PR - .+ - .+$", '', descripcion, flags=re.MULTILINE).strip()

    return tiempo_and_restante(fecha_hora), descripcion, materia

if __name__ == "__main__":

    # Texto de ejemplo proporcionado por el usuario
    eventos = [('TC 08/03/2024 - Datos Atípicos está en fecha de entrega', 'Mañana, 23:59\nEvento de curso\nPR - P24 - IA - ANÁLISIS DE DATOS', 'Añadir envío'), ('Cuestionario de la semana 8 (Responde antes del domingo 10 de marzo a las 11:59 pm) cierra', 'domingo, 10 marzo, 23:59\nEvento de curso\nPR - P24 - IA - FUNDAMENTOS DE ELECTRÓNICA', 'Ir a la actividad'), ('Parcial 2 - Tarea 04: - Replicar práctica de Datos Atípicos en Python está en fecha de entrega', 'lunes, 11 marzo, 23:59\nEvento de curso\nPR - P24 - IA - ANÁLISIS DE DATOS', 'Añadir envío'), ('Tarea 1 está en fecha de entrega', 'martes, 12 marzo, 23:00\nEvento de curso\nResolver los ejercicios, escribir todo el pro...f a la plataforma\nPR - P24 - C - CÁLCULO I', 'Añadir envío'), ('TC 23/02/2024 - Practica de Clase: Investigación está en fecha de entrega', 'domingo, 24 marzo, 23:59\nEvento de curso\nInvestigar cómo resolver en Python\nCálculos ...s\nRaíces\nPR - P24 - IA - ANÁLISIS DE DATOS', 'Ir a la actividad')]
    for evento in eventos:
        fecha, descripcion, materia = datos_descripcion(evento[1])
        print(f"Fecha: {fecha}\nDescripción: {descripcion}\nMateria: {materia}\n")