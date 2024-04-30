from datetime import datetime, timedelta
import os

def obtener_proximo_dia(dia_semana): #lunes
    # Diccionario para convertir los nombres de los días a números (0= Lunes, 6= Domingo)
    dias = {
        "lunes": 0,
        "martes": 1,
        "miercoles": 2,
        "jueves": 3,
        "viernes": 4,
        "sabado": 5,
        "domingo": 6,
    }

    hoy = datetime.today()  # Fecha de hoy
    dia_actual = hoy.weekday()  # Número del día actual (0= Lunes, 6= Domingo)

    if dia_semana == "hoy":
        return hoy
    elif dia_semana == "mañana":
        return hoy + timedelta(days=1)
    else:
        # Número del día de la semana deseado
        dia_deseado = dias[dia_semana]

        # Diferencia entre el día deseado y el día actual
        diferencia = dia_deseado - dia_actual

        # Si la diferencia es negativa, sumamos 7 para encontrar el próximo día
        if diferencia <= 0:
            diferencia += 7

        # Retornamos la fecha actual más la diferencia de días para llegar al próximo día deseado
        return hoy + timedelta(days=diferencia)

def tiempo_and_restante(fecha):
    fecha_normalizada = normalizar_fecha(fecha)
    if fecha_normalizada is None:
        # Manejo del caso en que la fecha no puede ser normalizada
        return None, 0, 0, 0, 0  # o manejar de otra manera según lo necesites

    tiempo_restante = fecha_normalizada - datetime.now()
    total_segundos = tiempo_restante.total_seconds()
    dias = int(total_segundos // 86400)
    resto = total_segundos % 86400
    horas = int(resto // 3600)
    resto = resto % 3600
    minutos = int(resto // 60)
    segundos = int(resto % 60)
    return fecha_normalizada, dias, horas, minutos, segundos


def normalizar_fecha(fecha):
    fecha = fecha.lower()
    cantidadSeparadores = fecha.count(", ")
    #Aquí solo hay dia y hora
    if cantidadSeparadores == 1:
        fecha = fecha.replace(", ", ",")
        fecha = fecha.split(",")
        dia_semana,hora,minuto = fecha[0], fecha[1].split(":")[0], fecha[1].split(":")[1]
        fecha_nueva = obtener_proximo_dia(dia_semana)
        
        return datetime(fecha_nueva.year,fecha_nueva.month,fecha_nueva.day,int(hora),int(minuto))
        
    
    if cantidadSeparadores == 2:
        fecha = fecha.replace(", ", ",")
        fecha = fecha.split(",")
        dia_semana, dia_fecha, mes, hora, minuto = fecha[0], fecha[1].split(" ")[0] , fecha[1].split(" ")[1], fecha[2].split(":")[0],fecha[2].split(":")[1]
        fecha_nueva = obtener_proximo_dia(dia_semana)
        return datetime(fecha_nueva.year,fecha_nueva.month,int(dia_fecha),int(hora),int(minuto))




if __name__ == "__main__":
    os.system("clear")


    fecha_user = "martes, 2 abril, 14:00"
    fecha_user2 = "Jueves, 12:33"
    fecha_user3 = "doMingo, 24 diciembre, 23:59"
    fecha_user4 = "hoy, 13:00"

    fecha, dias, horas, minutos, segundos = tiempo_and_restante(fecha_user)
    print(f"Fecha: {fecha}")
    print(f"Días: {dias} , Horas: {horas} , Minutos: {minutos} , Segundos: {segundos}")