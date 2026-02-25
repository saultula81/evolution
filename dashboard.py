import tkinter as tk
from tkinter import ttk, messagebox
import json
import threading
import os
import sys
from PIL import Image, ImageTk

# Import local tools
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "tools"))
from scanner import scan_dir as scanner_scan
from launcher import launch_project

class ProjectManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("System Pilot - Project Manager")
        self.root.geometry("1000x700")
        self.root.configure(bg="#121212")
        
        self.style = ttk.Style()
        self.style.theme_use('clam')
        
        # Define Premium Styles
        self.style.configure("TFrame", background="#121212")
        self.style.configure("Project.TFrame", background="#1E1E1E", borderwidth=1, relief="solid")
        self.style.configure("TLabel", background="#121212", foreground="#FFFFFF", font=("Segoe UI", 10))
        self.style.configure("Title.TLabel", font=("Segoe UI", 18, "bold"), foreground="#BB86FC", background="#121212")
        self.style.configure("ProjectName.TLabel", background="#1E1E1E", font=("Segoe UI", 10, "bold"), foreground="#FFFFFF")
        
        self.projects = []
        self.images = {} # Keep references to images
        
        self.setup_ui()
        self.refresh_projects()

    def setup_ui(self):
        # Header
        header = tk.Frame(self.root, bg="#121212", padx=20, pady=20)
        header.pack(fill="x")
        
        tk.Label(header, text="PROJECT MANAGER BOT", font=("Segoe UI", 18, "bold"), fg="#BB86FC", bg="#121212").pack(side="left")
        
        refresh_btn = tk.Button(
            header, text="REFRESH", command=self.refresh_projects,
            bg="#212121", fg="white", relief="flat", padx=15, pady=5,
            activebackground="#333333", activeforeground="white"
        )
        refresh_btn.pack(side="right")

        # Scrollable Area
        self.container = tk.Frame(self.root, bg="#121212")
        self.container.pack(fill="both", expand=True, padx=10, pady=10)

        self.canvas = tk.Canvas(self.container, bg="#121212", highlightthickness=0)
        self.scrollbar = ttk.Scrollbar(self.container, orient="vertical", command=self.canvas.yview)
        
        self.scrollable_frame = tk.Frame(self.canvas, bg="#121212")
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )

        self.canvas_frame = self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        
        # Adjust canvas width to fit window
        self.canvas.bind('<Configure>', self.on_canvas_configure)

        self.canvas.configure(yscrollcommand=self.scrollbar.set)

        self.canvas.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")

    def on_canvas_configure(self, event):
        self.canvas.itemconfig(self.canvas_frame, width=event.width)

    def refresh_projects(self):
        # Clear existing
        for widget in self.scrollable_frame.winfo_children():
            widget.destroy()
        self.images = {}

        # Scan paths
        paths = [r"D:\Poyectos", r"e:\evolucion"]
        self.projects = []
        for p in paths:
            if os.path.exists(p):
                self.projects.extend(scanner_scan(p))

        # Grid Layout Calculation
        cols = 3
        for i, proj in enumerate(self.projects):
            row = i // cols
            col = i % cols
            self.create_project_card(proj, row, col)

    def create_project_card(self, proj, row, col):
        # Build card container
        card = tk.Frame(self.scrollable_frame, bg="#1E1E1E", padx=10, pady=10, highlightbackground="#333333", highlightthickness=1)
        card.grid(row=row, column=col, padx=10, pady=10, sticky="nsew")
        
        # Ensure grid columns are equal
        self.scrollable_frame.grid_columnconfigure(col, weight=1, uniform="group1")

        # Thumbnail
        thumb_path = proj.get("thumbnail")
        if thumb_path and os.path.exists(thumb_path):
            try:
                img = Image.open(thumb_path)
                img.thumbnail((250, 140)) # Resize to fit card
                photo = ImageTk.PhotoImage(img)
                self.images[proj["id"]] = photo # Keep reference
                img_label = tk.Label(card, image=photo, bg="#1E1E1E")
                img_label.pack(fill="x", pady=(0, 10))
            except Exception:
                self.create_placeholder(card)
        else:
            self.create_placeholder(card)

        # Labels
        name_lbl = tk.Label(card, text=proj["name"].upper(), bg="#1E1E1E", fg="white", font=("Segoe UI", 10, "bold"), wraplength=230)
        name_lbl.pack(anchor="w")
        
        path_lbl = tk.Label(card, text=os.path.basename(proj["path"]), bg="#1E1E1E", fg="#888888", font=("Segoe UI", 8))
        path_lbl.pack(anchor="w")

        # Launch Button
        btn_frame = tk.Frame(card, bg="#1E1E1E", pady=10)
        btn_frame.pack(fill="x")
        
        launch_btn = tk.Button(
            btn_frame, text="LAUNCH SERVER", 
            command=lambda p=proj: self.start_project(p),
            bg="#BB86FC", fg="#000000", relief="flat", 
            font=("Segoe UI", 9, "bold"), pady=5
        )
        launch_btn.pack(fill="x")

    def create_placeholder(self, parent):
        placeholder = tk.Frame(parent, bg="#2A2A2A", height=140)
        placeholder.pack_propagate(False)
        placeholder.pack(fill="x", pady=(0, 10))
        tk.Label(placeholder, text="NO PREVIEW", bg="#2A2A2A", fg="#555555", font=("Segoe UI", 10, "bold")).pack(expand=True)

    def start_project(self, proj):
        threading.Thread(target=self.launch_thread, args=(proj,), daemon=True).start()

    def launch_thread(self, proj):
        print(f"Launching {proj['name']}...")
        success, process = launch_project(proj["path"], proj["server_command"])
        if success:
            messagebox.showinfo("Success", f"{proj['name']} is now running!")
        else:
            messagebox.showerror("Error", f"Failed to launch {proj['name']} after 3 attempts.")

if __name__ == "__main__":
    root = tk.Tk()
    app = ProjectManagerApp(root)
    root.mainloop()
