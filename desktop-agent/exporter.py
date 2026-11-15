import os
import requests
import customtkinter as ctk
import mutagen
from mutagen.id3 import ID3, COMM, ID3NoHeaderError
from tkinter import filedialog, messagebox
import threading

# --- CONFIGURATION ---
API_BASE_URL = "http://marcib.ddns.net:4000/api"
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

class DJExporterAgent(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("DJ Brain - Exporter par Tag")
        self.geometry("650x550")
        
        # État
        self.target_folder = ""
        self.all_tracks = []
        self.unique_tags = []
        self.downloading = False
        
        self.setup_ui()

    def setup_ui(self):
        # Titre
        self.label_title = ctk.CTkLabel(
            self, 
            text="DJ Brain - Exportateur de Sons", 
            font=ctk.CTkFont(size=24, weight="bold")
        )
        self.label_title.pack(pady=(20, 5))
        
        self.label_desc = ctk.CTkLabel(
            self, 
            text="Téléchargez uniquement les musiques possédant un tag spécifique\net injectez directement les tags dedans.", 
            text_color="gray"
        )
        self.label_desc.pack(pady=(0, 20))

        # Connexion & Chargement des Tags
        self.frame_top = ctk.CTkFrame(self, fg_color="transparent")
        self.frame_top.pack(fill="x", padx=40, pady=5)
        
        self.label_api = ctk.CTkLabel(self.frame_top, text="Serveur API :", width=100, anchor="w")
        self.label_api.pack(side="left")
        
        self.entry_api = ctk.CTkEntry(self.frame_top, width=280)
        self.entry_api.insert(0, API_BASE_URL)
        self.entry_api.pack(side="left", padx=(0, 10))
        
        self.btn_load_tags = ctk.CTkButton(
            self.frame_top, 
            text="Charger les Tags", 
            command=self.load_tags, 
            width=120,
            fg_color="#6d28d9", 
            hover_color="#5b21b6"
        )
        self.btn_load_tags.pack(side="right")

        # Sélection dossier destination
        self.frame_folder = ctk.CTkFrame(self, fg_color="transparent")
        self.frame_folder.pack(fill="x", padx=40, pady=10)
        
        self.label_folder = ctk.CTkLabel(
            self.frame_folder, 
            text="Destination : Non sélectionnée", 
            width=390, 
            anchor="w",
            text_color="yellow"
        )
        self.label_folder.pack(side="left", padx=(0, 10))
        
        self.btn_select = ctk.CTkButton(
            self.frame_folder, 
            text="Parcourir...", 
            command=self.select_folder, 
            width=120
        )
        self.btn_select.pack(side="right")

        # Sélection du tag
        self.frame_tag = ctk.CTkFrame(self, fg_color="transparent")
        self.frame_tag.pack(fill="x", padx=40, pady=5)
        
        self.label_tag_sel = ctk.CTkLabel(self.frame_tag, text="Choisir le Tag :", width=100, anchor="w")
        self.label_tag_sel.pack(side="left")
        
        self.combo_tags = ctk.CTkComboBox(self.frame_tag, values=[], width=280, state="readonly")
        self.combo_tags.pack(side="left", padx=(0, 10))

        # Checkbox option de synchro directe
        self.check_sync_tags = ctk.CTkCheckBox(
            self, 
            text="Écrire et synchroniser directement les tags Rekordbox dans les fichiers audio (.mp3)",
            font=ctk.CTkFont(size=11)
        )
        self.check_sync_tags.select()
        self.check_sync_tags.pack(pady=10, padx=40, anchor="w")

        # Barre de Progression
        self.progress_bar = ctk.CTkProgressBar(self, width=540)
        self.progress_bar.set(0)
        self.progress_bar.pack(pady=(10, 5), padx=40)

        # Logs
        self.textbox_log = ctk.CTkTextbox(self, height=140, state="disabled")
        self.textbox_log.pack(fill="both", expand=True, padx=40, pady=10)

        # Action principale
        self.btn_export = ctk.CTkButton(
            self, 
            text="Exporter les sons correspondants", 
            command=self.start_export_thread, 
            state="disabled", 
            fg_color="#059669", 
            hover_color="#047857",
            height=40,
            font=ctk.CTkFont(weight="bold")
        )
        self.btn_export.pack(pady=(10, 20))

    def log(self, message):
        self.textbox_log.configure(state="normal")
        self.textbox_log.insert("end", f"{message}\n")
        self.textbox_log.see("end")
        self.textbox_log.configure(state="disabled")

    def select_folder(self):
        folder = filedialog.askdirectory(title="Sélectionner le dossier de destination ou clé USB")
        if folder:
            self.target_folder = folder
            self.label_folder.configure(text=f"Destination : {folder}", text_color="white")
            self.log(f"📁 Dossier cible sélectionné : {folder}")
            self.check_enable_export()

    def check_enable_export(self):
        if self.target_folder and self.combo_tags.get() and not self.downloading:
            self.btn_export.configure(state="normal")
        else:
            self.btn_export.configure(state="disabled")

    def load_tags(self):
        api_url = self.entry_api.get().strip()
        self.log(f"🔌 Connexion à {api_url}/tracks...")
        
        def run():
            try:
                res = requests.get(f"{api_url}/tracks")
                if res.status_code == 200:
                    self.all_tracks = res.json()
                    
                    # Extraire tous les tags uniques
                    tags_set = set()
                    for t in self.all_tracks:
                        for tag_obj in t.get('tags', []):
                            if isinstance(tag_obj, dict) and tag_obj.get('name'):
                                tags_set.add(tag_obj['name'])
                            elif isinstance(tag_obj, str):
                                tags_set.add(tag_obj)
                    
                    self.unique_tags = sorted(list(tags_set))
                    
                    # Mettre à jour la combobox
                    self.combo_tags.configure(values=self.unique_tags)
                    if self.unique_tags:
                        self.combo_tags.set(self.unique_tags[0])
                        self.log(f"✅ Tags chargés ! {len(self.all_tracks)} sons trouvés, {len(self.unique_tags)} tags uniques disponibles.")
                    else:
                        self.log("⚠️ Aucun tag trouvé sur le serveur.")
                    
                    self.check_enable_export()
                else:
                    self.log(f"❌ Erreur serveur: {res.status_code}")
            except Exception as e:
                self.log(f"❌ Impossible de joindre le serveur : {e}")
                
        threading.Thread(target=run, daemon=True).start()

    def start_export_thread(self):
        if self.downloading:
            return
        self.start_export()

    def write_tags_to_file(self, file_path, tags_list):
        """Met à jour les tags ID3 avec le format Rekordbox (#tag1;#tag2)"""
        try:
            # Construction de la chaîne Rekordbox
            tags_str = ";".join(tags_list)
            rekordbox_comment = f"#djtags: {tags_str}"
            
            try:
                audio = ID3(file_path)
            except ID3NoHeaderError:
                audio = ID3()

            # Nettoyer les anciens commentaires
            keys_to_delete = [k for k in audio.keys() if k.startswith('COMM')]
            for k in keys_to_delete:
                del audio[k]

            # Ajouter le commentaire standard Rekordbox
            audio.add(COMM(encoding=3, lang='eng', desc='', text=rekordbox_comment))
            audio.save(file_path, v2_version=3)
            return True
        except Exception as e:
            self.log(f"  ⚠️ Impossible d'écrire les tags ID3 : {e}")
            return False

    def start_export(self):
        tag_to_find = self.combo_tags.get()
        api_url = self.entry_api.get().strip()
        
        if not tag_to_find:
            messagebox.showwarning("Attention", "Veuillez sélectionner un tag.")
            return
            
        # Filtrer les morceaux
        matching_tracks = []
        for track in self.all_tracks:
            track_tags = [t['name'] for t in track.get('tags', []) if isinstance(t, dict)]
            if tag_to_find in track_tags:
                matching_tracks.append(track)
                
        if not matching_tracks:
            self.log(f"ℹ️ Aucun morceau ne possède le tag '{tag_to_find}'.")
            return

        self.log(f"\n🚀 Début de l'export de {len(matching_tracks)} morceau(x) avec le tag '{tag_to_find}'...")
        
        self.downloading = True
        self.btn_export.configure(state="disabled")
        self.btn_load_tags.configure(state="disabled")
        self.btn_select.configure(state="disabled")

        def run_downloads():
            total = len(matching_tracks)
            successful_downloads = 0
            
            for index, track in enumerate(matching_tracks, 1):
                file_name = track['file_name']
                track_id = track['id']
                track_tags = [t['name'] for t in track.get('tags', []) if isinstance(t, dict)]
                
                self.log(f"[{index}/{total}] Téléchargement de : {file_name}...")
                self.progress_bar.set(index / total)
                
                dest_path = os.path.join(self.target_folder, file_name)
                
                try:
                    # Stream le fichier
                    stream_url = f"{api_url}/tracks/{track_id}/stream"
                    with requests.get(stream_url, stream=True) as r:
                        r.raise_for_status()
                        with open(dest_path, 'wb') as f:
                            for chunk in r.iter_content(chunk_size=8192):
                                f.write(chunk)
                                
                    self.log(f"  → Fichier téléchargé avec succès.")
                    successful_downloads += 1
                    
                    # Synchroniser directement les tags si coché
                    if self.check_sync_tags.get():
                        if file_name.lower().endswith('.mp3'):
                            self.log(f"  → Injection des tags Rekordbox : {track_tags}")
                            self.write_tags_to_file(dest_path, track_tags)
                        else:
                            self.log(f"  → Info: Injection ignorée (les tags Rekordbox via ID3 sont réservés aux fichiers .mp3)")
                            
                except Exception as e:
                    self.log(f"  ❌ Échec pour {file_name} : {e}")
                    if os.path.exists(dest_path):
                        try:
                            os.remove(dest_path)
                        except:
                            pass
            
            self.log(f"\n🏁 Export terminé. {successful_downloads}/{total} morceau(x) exportés avec succès !")
            self.downloading = False
            self.progress_bar.set(0)
            self.btn_load_tags.configure(state="normal")
            self.btn_select.configure(state="normal")
            self.check_enable_export()
            
            messagebox.showinfo("Export terminé", f"{successful_downloads} sons exportés dans :\n{self.target_folder}")

        threading.Thread(target=run_downloads, daemon=True).start()

if __name__ == "__main__":
    app = DJExporterAgent()
    app.mainloop()
