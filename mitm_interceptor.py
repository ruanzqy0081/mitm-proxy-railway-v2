import os
import requests
import json
from mitmproxy import http

# Configurações
REPLACEMENT_FILE_PATH = "/home/ubuntu/upload/assetindexer.z4c5PKvI2Gj~2BSdP~2BeRekPvzPvXY~3D"
AUTH_SERVER_URL = os.getenv("AUTH_SERVER_URL", "http://localhost:3000")
UDID_FILE = "/tmp/device_udid.txt"  # Arquivo onde o app IPA armazena o UDID

class FreeFireInterceptor:
    def __init__(self):
        print(f"[*] MITM Proxy Interceptor iniciado.")
        print(f"[*] Servidor de Liberação: {AUTH_SERVER_URL}")
        print(f"[*] Arquivo de substituição: {REPLACEMENT_FILE_PATH}")
        
        if not os.path.exists(REPLACEMENT_FILE_PATH):
            print(f"[!] ERRO: Arquivo de substituição não encontrado em {REPLACEMENT_FILE_PATH}")

    def get_device_udid(self):
        """Tenta obter o UDID do arquivo ou de uma variável de ambiente"""
        # Primeiro tenta ler do arquivo
        if os.path.exists(UDID_FILE):
            try:
                with open(UDID_FILE, 'r') as f:
                    udid = f.read().strip()
                    if udid:
                        return udid
            except:
                pass
        
        # Se não encontrar, tenta variável de ambiente
        udid = os.getenv("DEVICE_UDID")
        if udid:
            return udid
        
        # Se ainda não encontrar, retorna None
        return None

    def request(self, flow: http.HTTPFlow) -> None:
        # Identifica se a requisição é para o arquivo assetindexer do Free Fire
        if "assetindexer" in flow.request.pretty_url:
            print(f"[+] Requisição detectada para assetindexer: {flow.request.pretty_url}")
            
            # Obter UDID do dispositivo
            udid = self.get_device_udid()
            
            if not udid:
                print(f"[X] ERRO: UDID do dispositivo não encontrado!")
                print(f"[!] Configure a variável DEVICE_UDID ou crie {UDID_FILE}")
                return
            
            print(f"[*] UDID do dispositivo: {udid}")
            
            try:
                # Verificar se o UDID está autorizado
                check_url = f"{AUTH_SERVER_URL}/check-license?udid={udid}"
                print(f"[*] Verificando licença em: {check_url}")
                
                auth_response = requests.get(check_url, timeout=5)
                
                if auth_response.status_code == 200:
                    license_info = auth_response.json()
                    print(f"[✓] Licença AUTORIZADA para UDID: {udid}")
                    print(f"[✓] Dispositivo: {license_info.get('deviceName', 'Unknown')}")
                    print(f"[✓] Dias restantes: {license_info.get('daysRemaining', 'N/A')}")
                    
                    # Substituir o arquivo
                    with open(REPLACEMENT_FILE_PATH, "rb") as f:
                        content = f.read()
                        
                    flow.response = http.Response.make(
                        200,
                        content,
                        {"Content-Type": "application/octet-stream"}
                    )
                    print(f"[!] Arquivo assetindexer SUBSTITUÍDO com sucesso!")
                else:
                    error_msg = auth_response.json().get('error', 'Acesso negado')
                    print(f"[X] Licença BLOQUEADA para UDID: {udid}")
                    print(f"[X] Motivo: {error_msg}")
            
            except requests.exceptions.Timeout:
                print(f"[!] TIMEOUT: Servidor de liberação não respondeu em tempo")
            except requests.exceptions.ConnectionError:
                print(f"[!] ERRO: Não foi possível conectar ao servidor de liberação")
                print(f"[!] URL: {AUTH_SERVER_URL}")
            except Exception as e:
                print(f"[!] Erro ao consultar servidor de liberação: {e}")

addons = [
    FreeFireInterceptor()
]
