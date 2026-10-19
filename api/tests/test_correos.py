"""Contrato de Graph y del adjunto; no envía correos reales."""
import base64
from io import BytesIO
from zipfile import ZipFile

import httpx
import pytest

from app import correos


def test_mensaje_contiene_guia_y_respuesta_al_remitente():
    m = correos.mensaje('Ana', 'ana@example.com', 'SOL-TEST-1', 'Conciliar', 'alexandra.paiz@grupopdc.com')['message']
    assert 'SOL-TEST-1' in m['subject']
    assert m['toRecipients'] == [{'emailAddress': {'address': 'ana@example.com'}}]
    assert m['replyTo'][0]['emailAddress']['address'] == 'alexandra.paiz@grupopdc.com'
    adjunto = m['attachments'][0]
    with ZipFile(BytesIO(base64.b64decode(adjunto['contentBytes']))) as doc:
        xml = doc.read('word/document.xml').decode()
        for contenido in ('SharePoint', 'Fuentes de información', 'Horas-hombre', 'contactos necesarios'):
            assert contenido in xml
        assert '```mermaid' not in xml
        assert len([n for n in doc.namelist() if n.startswith('word/media/')]) == 2


@pytest.mark.parametrize('status', [202, 403, 429, 503])
def test_graph_aceptacion_y_errores(monkeypatch, status):
    import azure.identity
    from types import SimpleNamespace
    class Cred:
        def __init__(self, **kwargs): pass
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def get_token(self, scope):
            assert scope == 'https://graph.microsoft.com/.default'
            return SimpleNamespace(token='simulado')
    def post(url, **kwargs):
        assert url.endswith('/users/alexandra.paiz%40grupopdc.com/sendMail')
        assert kwargs['headers']['Authorization'] == 'Bearer simulado'
        assert kwargs['json']['message']['attachments'][0]['contentBytes']
        return httpx.Response(status)
    monkeypatch.setattr(azure.identity, 'ManagedIdentityCredential', Cred)
    monkeypatch.setattr(correos.httpx, 'post', post)
    args = ('Ana', 'ana@example.com', 'SOL-TEST', 'Prueba', 'alexandra.paiz@grupopdc.com')
    if status == 202:
        correos.enviar(*args)
    else:
        with pytest.raises(correos.ErrorEnvio, match=f'graph_{status}'):
            correos.enviar(*args)


def test_worker_no_se_activa_por_solo_tener_remitente(monkeypatch):
    monkeypatch.setenv('NEXO_CORREO_REMITENTE', 'alexandra.paiz@grupopdc.com')
    monkeypatch.delenv('NEXO_CORREO_ACTIVO', raising=False)
    worker = correos.Entregas()
    worker.iniciar()
    assert worker.tarea is None
