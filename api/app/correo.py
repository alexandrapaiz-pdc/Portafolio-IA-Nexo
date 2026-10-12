"""Correo al solicitante: apenas alguien envía una solicitud, le llega la guía de intake.

Se envía con Microsoft Graph desde un buzón de Grupo PDC, con la identidad administrada
de la app (permiso de aplicación Mail.Send, limitado a ese buzón). Sin contraseñas.
Si el envío falla, la solicitud se guarda igual.

Variables:
  NEXO_CORREO_REMITENTE   buzón que envía (y recibe las respuestas); por defecto, el de Alexandra
  NEXO_GUIA_INTAKE        enlace a la guía de intake en SharePoint; por defecto, la guía vigente
  AZURE_CLIENT_ID         id de cliente de la identidad id-<app>
"""
import html
import logging
import os

import httpx

log = logging.getLogger("correo")
_ALCANCE = "https://graph.microsoft.com/.default"
REMITENTE = "alexandra.paiz@grupopdc.com"
GUIA_INTAKE = "https://codisaco.sharepoint.com/:w:/r/sites/05ServiciosCompartidos-PlaneacinyGestin/_layouts/15/Doc.aspx?sourcedoc=%7B0DB89966-6CF7-4F19-BCB1-921A69F2BBA2%7D&file=Guia%20de%20intake%20-%20Formato%20limpio.docx&action=default&mobileredirect=true&wdwpf=doclib-t"


def _token() -> str:
    from azure.identity import ManagedIdentityCredential

    return ManagedIdentityCredential(client_id=os.environ.get("AZURE_CLIENT_ID")).get_token(_ALCANCE).token


def mensaje(nombre: str, codigo: str, titulo: str, guia: str) -> tuple[str, str]:
    """Asunto y cuerpo (HTML) del correo, en español."""
    e = html.escape
    asunto = f"Solicitud {codigo} recibida: completa la guía de intake"
    cuerpo = f"""<div style="font:15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;color:#0F141B;max-width:560px">
<p>Hola {e(nombre.split(" ")[0] or nombre)}:</p>
<p>Recibimos tu solicitud <b>{e(codigo)}</b>, «{e(titulo)}». Gracias por enviarla.</p>
<p>El siguiente paso es completar la <b>guía de intake</b>. Con ella entendemos el proceso a fondo antes de evaluarlo contigo:</p>
<p><a href="{e(guia, quote=True)}" style="display:inline-block;padding:10px 18px;border-radius:999px;background:#FF5100;color:#fff;text-decoration:none;font-weight:600">Abrir la guía de intake</a></p>
<p><b>Puedes usar IA para llenarla.</b> Claude u otra herramienta de IA aprobada por la empresa puede ayudarte a redactar las respuestas a partir de tus notas, correos o documentos del proceso. Revisa que todo sea correcto antes de enviarla.</p>
<p>Cuando la tengas lista, responde a este correo con el documento.</p>
<p>Alexandra Paiz<br>Forward Deployed Engineer de IA · Nexo, Grupo PDC</p>
</div>"""
    return asunto, cuerpo


def enviar_intake(correo: str, nombre: str, codigo: str, titulo: str) -> bool:
    """Envía el correo; nunca lanza error (la solicitud ya quedó guardada)."""
    remitente = os.environ.get("NEXO_CORREO_REMITENTE", REMITENTE)
    guia = os.environ.get("NEXO_GUIA_INTAKE", GUIA_INTAKE)
    if not remitente or not guia or not correo:
        log.info("Correo de intake sin configurar; no se envía")
        return False
    asunto, cuerpo = mensaje(nombre, codigo, titulo, guia)
    datos = {
        "message": {
            "subject": asunto,
            "body": {"contentType": "HTML", "content": cuerpo},
            "toRecipients": [{"emailAddress": {"address": correo, "name": nombre}}],
        },
        "saveToSentItems": True,
    }
    try:
        r = httpx.post(f"https://graph.microsoft.com/v1.0/users/{remitente}/sendMail", json=datos,
                       headers={"Authorization": f"Bearer {_token()}"}, timeout=20)
        if r.status_code >= 400:
            log.warning("Graph rechazó el correo de intake: %s", r.status_code)
            return False
        return True
    except Exception:  # noqa: BLE001 - el correo nunca debe tumbar la solicitud
        log.exception("No se pudo enviar el correo de intake")
        return False
