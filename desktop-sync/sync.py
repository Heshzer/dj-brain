import os
import shutil
import hashlib
import json
import urllib.request
import urllib.error
from mutagen.id3 import ID3, COMM, error as ID3Error

# --- CONFIGURATION (Temporaire pour test local) ---
API_BASE_URL = "http://localhost:4000/api"
USB_DRIVE_PATH = r"C:\Users\PC\EasyPeazy\dj-brain\test_usb"


def calculate_file_hash(filepath):
    """Calcule le hash SHA-256 d'un fichier audio (pour le retrouver sur le serveur)"""
    sha256_hash = hashlib.sha256()
    with open(filepath, "rb") as f:
        # Lire en blocs de 4K
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def fetch_tracks_from_api():
    """Récupère la liste de toutes les tracks avec leurs tags depuis l'API"""
    try:
        req = urllib.request.Request(f"{API_BASE_URL}/tracks")
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data
    except Exception as e:
        print(f"Erreur de connexion à l'API: {e}")
        return None

def safe_update_tags(file_path, new_tags_string):
    """Met à jour les ID3 en toute sécurité avec backup."""
    backup_path = file_path + ".backup"
    
    # 1. Backup Automatique
    print("Création de sauvegarde...")
    shutil.copy2(file_path, backup_path)
    
    try:
        # 2. Modification ID3
        try:
            audio = ID3(file_path)
        except ID3Error:
            # S'il n'y a pas encore de tag ID3, on en crée un
            audio = ID3()
            
        print(f"Injection des tags: {new_tags_string}")    
        # Supprimer les anciens COMM pour éviter les doublons
        # Rekordbox lit COMM avec desc='' (description vide)
        keys_to_delete = [k for k in audio.keys() if k.startswith('COMM')]
        for k in keys_to_delete:
            del audio[k]
        # Écrire avec description VIDE = format standard que Rekordbox lit
        audio.add(COMM(encoding=3, lang='eng', desc='', text=new_tags_string))
        audio.save(v2_version=3) # Rekordbox préfère l'ID3v2.3
            
        # 3. Vérification basique (si on arrive ici sans erreur, c'est bon signe)
        print("Vérification...")
        test_audio = ID3(file_path)
        
        # 4. Suppression du backup si OK
        os.remove(backup_path)
        print("Opération réussie.\n")
        return True
        
    except Exception as e:
        print(f"ERREUR CRITIQUE. Restauration du fichier. {e}")
        shutil.copy2(backup_path, file_path)
        os.remove(backup_path)
        return False

def sync_all():
    print(f"--- DÉMARRAGE SYNCHRO ({USB_DRIVE_PATH}) ---")
    
    # 1. Obtenir les données serveur
    print("Téléchargement des tags depuis le Cloud...")
    server_tracks = fetch_tracks_from_api()
    if not server_tracks:
        return
        
    # On crée un dictionnaire facile à chercher par nom de fichier (pour l'instant)
    # Dans une version parfaite, on chercherait par Hash, mais FileZilla a pu modifier le fichier
    tracks_db = {t['file_name']: t for t in server_tracks}
    
    # 2. Scanner le dossier USB
    print("Scan de la clé USB...")
    if not os.path.exists(USB_DRIVE_PATH):
        print(f"Le dossier {USB_DRIVE_PATH} n'existe pas.")
        return
        
    for root, _, files in os.walk(USB_DRIVE_PATH):
        for file in files:
            if file.lower().endswith(('.mp3', '.aiff', '.wav')): # Note: WAV utilise list_info pas id3
                if file in tracks_db:
                    track_data = tracks_db[file]
                    # Récupérer les tags
                    tags = track_data.get('tags', [])
                    if len(tags) > 0:
                        tags_str = ";".join([t['name'] for t in tags])
                        rekordbox_format = f"#{tags_str}" # "#Afro;#Warmup"
                        
                        fullpath = os.path.join(root, file)
                        print(f"-> Traitement de: {file} avec '{rekordbox_format}'")
                        safe_update_tags(fullpath, rekordbox_format)

if __name__ == "__main__":
    sync_all()
