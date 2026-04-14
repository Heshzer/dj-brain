import os
import shutil
import hashlib
import json
import requests
import customtkinter as ctk
import mutagen
from mutagen.id3 import ID3, COMM, ID3NoHeaderError
from tkinter import filedialog, messagebox

# --- CONFIGURATION ---
# Adresse de l'API de base (doit pointer vers le serveur de ton ami ou Vercel en fonction de l'endroit où tourne l'API)
API_BASE_URL = "http://marcib.ddns.net:4000/api"
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class DJSyncAgent(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("DJ Brain - Desktop Sync Agent")
        self.geometry("600x450")
        
        # État
        self.target_folder = ""
        self.changes_to_apply = []
        
        self.setup_ui()

    def setup_ui(self):
        # Titre
        self.label_title = ctk.CTkLabel(self, text="Synchronisation Rekordbox", font=ctk.CTkFont(size=24, weight="bold"))
        self.label_title.pack(pady=(20, 10))
        
        self.label_desc = ctk.CTkLabel(self, text="Cet outil scanne votre clé USB ou dossier DJ\net applique les tags modifiés depuis l'application Web.", text_color="gray")
        self.label_desc.pack(pady=(0, 20))

        # Sélection dossier
        self.frame_folder = ctk.CTkFrame(self, fg_color="transparent")
        self.frame_folder.pack(fill="x", padx=40, pady=10)
        
        self.label_folder = ctk.CTkLabel(self.frame_folder, text="Dossier cible : Non sélectionné", width=400, anchor="w")
        self.label_folder.pack(side="left", padx=(0, 10))
        
        self.btn_select = ctk.CTkButton(self.frame_folder, text="Parcourir...", command=self.select_folder, width=100)
        self.btn_select.pack(side="right")

        # Statut & Logs
        self.textbox_log = ctk.CTkTextbox(self, height=150, state="disabled")
        self.textbox_log.pack(fill="both", expand=True, padx=40, pady=10)

        # Actions
        self.frame_actions = ctk.CTkFrame(self, fg_color="transparent")
        self.frame_actions.pack(fill="x", padx=40, pady=20)
        
        self.btn_fetch = ctk.CTkButton(self.frame_actions, text="1. Vérifier les MàJ Serveur", command=self.fetch_changes, fg_color="#6d28d9", hover_color="#5b21b6")
        self.btn_fetch.pack(side="left", expand=True, padx=5)
        
        self.btn_sync = ctk.CTkButton(self.frame_actions, text="2. Appliquer les Tags (Sûr)", command=self.apply_sync, state="disabled", fg_color="#059669", hover_color="#047857")
        self.btn_sync.pack(side="right", expand=True, padx=5)

    def log(self, message):
        self.textbox_log.configure(state="normal")
        self.textbox_log.insert("end", f"{message}\n")
        self.textbox_log.see("end")
        self.textbox_log.configure(state="disabled")

    def select_folder(self):
        folder = filedialog.askdirectory(title="Sélectionner la clé USB ou le dossier DJ")
        if folder:
            self.target_folder = folder
            self.label_folder.configure(text=f"Cible : {folder}")
            self.log(f"Dossier sélectionné : {folder}")

    def fetch_changes(self):
        self.log("\n--- Récupération des changements depuis le serveur ---")
        try:
            # Récupérer toutes les tracks en "PENDING"
            response = requests.get(f"{API_BASE_URL}/sync/changes")
            if response.status_code == 200:
                self.changes_to_apply = response.json()
                if not self.changes_to_apply:
                    self.log("✅ Aucune synchronisation en attente.")
                    self.btn_sync.configure(state="disabled")
                else:
                    self.log(f"📥 {len(self.changes_to_apply)} track(s) nécessitent une mise à jour de tags.")
                    self.btn_sync.configure(state="normal")
            else:
                self.log(f"❌ Erreur serveur: {response.status_code}")
        except Exception as e:
            self.log(f"❌ Erreur de connexion au serveur : {e}")

    def safe_update_tags(self, file_path, new_tags_string):
        """Procédure sécurisée de modification de métadonnées ID3"""
        backup_path = file_path + ".backup"
        
        try:
            # 1. Backup Automatique
            shutil.copy2(file_path, backup_path)
            
            # 2. Modification ID3
            try:
                audio = ID3(file_path)
            except ID3NoHeaderError:
                audio = ID3()
            
            # Suppression des anciens commentaires Rekordbox (#djtags) s'ils existent (simplifié ici par écrasement)
            # Ajout du nouveau tag au format Rekordbox (#djtags: ...)
            audio.add(COMM(encoding=3, lang='eng', desc='', text=new_tags_string))
            audio.save(file_path)
            
            # 3. Vérification intégrité
            test_audio = mutagen.File(file_path)
            if test_audio is None or test_audio.info.length <= 0:
                raise Exception("Test d'intégrité échoué post-écriture")
                
            # 4. Nettoyage
            os.remove(backup_path)
            return True
            
        except Exception as e:
            # Restauration en cas d'erreur
            self.log(f"⚠️ Erreur sur {os.path.basename(file_path)}, restauration du backup... ({e})")
            if os.path.exists(backup_path):
                shutil.copy2(backup_path, file_path)
                os.remove(backup_path)
            return False

    def apply_sync(self):
        if not self.target_folder:
            messagebox.showwarning("Attention", "Veuillez d'abord sélectionner un dossier cible.")
            return

        self.log("\n--- Début de l'application sécurisée ---")
        self.btn_sync.configure(state="disabled")
        self.btn_fetch.configure(state="disabled")

        # Construire un dictionnaire rapide des fichiers locaux (Nom -> Chemin absolu)
        # Dans un monde réel parfait, on comparerait le SHA-256 (file_hash), 
        # mais le hash de tout le sous-dossier est très lourd. 
        # On va baser la recherche sur le file_name et la taille (file_size_bytes).
        local_files = {}
        self.log("Scan rapide du dossier local...")
        for root, dirs, files in os.walk(self.target_folder):
            for file in files:
                if file.lower().endswith(('.mp3', '.flac', '.wav', '.aiff')):
                    if file not in local_files:
                        local_files[file] = []
                    local_files[file].append(os.path.join(root, file))

        def get_file_hash(filepath):
            h = hashlib.sha256()
            with open(filepath, 'rb') as f:
                while chunk := f.read(8192):
                    h.update(chunk)
            return h.hexdigest()

        synced_ids = []

        for track in self.changes_to_apply:
            file_name = track['file_name']
            file_size = track['file_size_bytes']
            file_hash = track.get('file_hash')
            track_id = track['id']
            rekordbox_comment = track['rekordbox_comment']

            if file_name in local_files:
                possible_paths = local_files[file_name]
                best_match = None
                
                # Check for exact hash match first
                if file_hash:
                    for p in possible_paths:
                        if get_file_hash(p) == file_hash:
                            best_match = p
                            break
                            
                # Fallback to size if no hash match or server didn't provide hash
                if not best_match:
                    for p in possible_paths:
                        if os.path.getsize(p) == int(file_size):
                            best_match = p
                            break
                            
                # If still no match but there's unique file, assume it's the right one
                if not best_match and len(possible_paths) == 1:
                    best_match = possible_paths[0]

                if best_match:
                    local_path = best_match
                    self.log(f"Traitement : {file_name}")
                    success = self.safe_update_tags(local_path, rekordbox_comment)
                    
                    if success:
                        self.log(f"  → Succès: Tags '{rekordbox_comment}' écrits.")
                        synced_ids.append(track_id)
                    else:
                        self.log(f"  → Échec: Ignoré.")
                else:
                    self.log(f"Correspondance impossible pour {file_name} (Taille/Hash différents)")
            else:
                self.log(f"Fichier introuvable localement : {file_name} (Ignoré)")

        # Accuser réception au serveur
        if synced_ids:
            try:
                res = requests.post(f"{API_BASE_URL}/sync/ack", json={"trackIds": synced_ids})
                if res.status_code == 200:
                    self.log(f"✅ {len(synced_ids)} morceaux synchronisés avec succès. Base mise à jour.")
            except Exception as e:
                self.log(f"❌ Les tags sont écrits mais le serveur n'a pas pu être contacté pour accuser réception.")

        self.changes_to_apply = []
        self.btn_fetch.configure(state="normal")
        self.log("Terminé. Vous pouvez faire 'Reload tags' dans Rekordbox.")

if __name__ == "__main__":
    app = DJSyncAgent()
    app.mainloop()
