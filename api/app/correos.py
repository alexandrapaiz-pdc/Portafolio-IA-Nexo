"""Entrega durable del formulario de intake mediante Microsoft Graph.

La identidad administrada necesita permiso de envío limitado al buzón configurado.
No se usa el token del usuario ni direcciones suministradas por el navegador.
"""
import asyncio
import base64
import logging
import os
import threading
from pathlib import Path
from urllib.parse import quote

import httpx

from . import conexion

log = logging.getLogger(__name__)
FORMULARIO = Path(__file__).resolve().parent / 'recursos' / 'guia-workflow-ia.docx'
MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
MAX_INTENTOS = 5


def encolar(cur, doc_id, datos, persona):
    cur.execute(
        """INSERT INTO correos_solicitudes (solicitud_id, destinatario, nombre, codigo, titulo)
           VALUES (%s, %s, %s, %s, %s) ON CONFLICT (solicitud_id) DO NOTHING""",
        (doc_id, persona.correo, persona.nombre, datos['code'], datos['title']),
    )


def mensaje(nombre, destinatario, codigo, titulo, remitente):
    return {
        'message': {
            'subject': f'{codigo} · Formulario para tu solicitud de IA',
            'body': {'contentType': 'Text', 'content': (
                f'Hola {nombre},\n\nRecibimos tu solicitud {codigo}: {titulo}.\n\n'
                'Adjuntamos la guía en Word para completar la información del workflow. '
                'Puedes escribir directamente en el documento y agregar filas a las tablas. '
                'Completa lo que sabes y marca lo que quede por definir.\n\n'
                'Responde a este correo con el documento completado, los contactos necesarios '
                'y el enlace a la carpeta completa de SharePoint donde trabajan el workflow. '
                'Solo leeremos los originales y haremos una copia para trabajar; '
                'no modificaremos, moveremos ni eliminaremos nada de tu carpeta.\n\n'
                'Gracias,\nAlexandra Paiz\nIA Nexo'
            )},
            'toRecipients': [{'emailAddress': {'address': destinatario}}],
            'replyTo': [{'emailAddress': {'address': remitente}}],
            'attachments': [{
                '@odata.type': '#microsoft.graph.fileAttachment',
                'name': 'Guia-workflow-IA.docx', 'contentType': MIME_DOCX,
                'contentBytes': base64.b64encode(FORMULARIO.read_bytes()).decode('ascii'),
            }],
        },
        'saveToSentItems': True,
    }


class ErrorEnvio(Exception):
    """Código seguro para logs y operadores: nunca contiene tokens ni contenido del correo."""


def enviar(nombre, destinatario, codigo, titulo, remitente):
    from azure.identity import ManagedIdentityCredential

    payload = mensaje(nombre, destinatario, codigo, titulo, remitente)
    with ManagedIdentityCredential(client_id=os.environ.get('AZURE_CLIENT_ID')) as cred:
        token = cred.get_token('https://graph.microsoft.com/.default').token
    r = httpx.post(
        f'https://graph.microsoft.com/v1.0/users/{quote(remitente, safe="")}/sendMail',
        headers={'Authorization': f'Bearer {token}'}, json=payload, timeout=20,
    )
    if r.status_code != 202:
        raise ErrorEnvio(f'graph_{r.status_code}')


def procesar_uno(remitente):
    """Bloqueo por fila evita que dos réplicas procesen el mismo correo a la vez.

    Graph no ofrece una clave de idempotencia: un corte tras la aceptación puede
    producir un duplicado al reintentar (entrega al menos una vez).
    """
    with conexion.pool().connection() as con, con.cursor() as cur:
        cur.execute("""SELECT solicitud_id, destinatario, nombre, codigo, titulo, intentos
                       FROM correos_solicitudes WHERE estado = 'pendiente' AND proximo_intento <= now()
                       ORDER BY proximo_intento LIMIT 1 FOR UPDATE SKIP LOCKED""")
        fila = cur.fetchone()
        if not fila:
            return False
        doc_id, destinatario, nombre, codigo, titulo, intentos = fila
        intentos += 1
        try:
            enviar(nombre, destinatario, codigo, titulo, remitente)
        except Exception as exc:
            error = str(exc) if isinstance(exc, ErrorEnvio) else type(exc).__name__
            estado = 'fallido' if intentos >= MAX_INTENTOS else 'pendiente'
            cur.execute("""UPDATE correos_solicitudes SET estado = %s, intentos = %s, ultimo_error = %s,
                           proximo_intento = now() + make_interval(secs => %s) WHERE solicitud_id = %s""",
                        (estado, intentos, error, min(60 * 2 ** (intentos - 1), 3600), doc_id))
            log.warning('Correo de intake %s: %s (intento %s, %s)', doc_id, error, intentos, estado)
        else:
            cur.execute("""UPDATE correos_solicitudes SET estado = 'aceptado', intentos = %s,
                           aceptado_en = now(), ultimo_error = NULL WHERE solicitud_id = %s""", (intentos, doc_id))
    return True


class Entregas:
    def __init__(self):
        self.parar = threading.Event()
        self.tarea = None

    def iniciar(self):
        remitente = os.environ.get('NEXO_CORREO_REMITENTE', '').strip()
        if os.environ.get('NEXO_CORREO_ACTIVO') != '1':
            log.warning('Envío de intake desactivado; las nuevas solicitudes conservarán su correo pendiente')
            return
        if not remitente or not FORMULARIO.is_file():
            raise RuntimeError('Configura NEXO_CORREO_REMITENTE y el adjunto antes de activar los correos')
        self.tarea = asyncio.create_task(asyncio.to_thread(self._trabajar, remitente))

    def _trabajar(self, remitente):
        while not self.parar.is_set():
            try:
                if procesar_uno(remitente):
                    continue
            except Exception as exc:
                log.error('Error del procesador de correos: %s', type(exc).__name__)
            self.parar.wait(10)

    async def cerrar(self):
        self.parar.set()
        if self.tarea:
            await self.tarea
