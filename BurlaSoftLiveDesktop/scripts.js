document.addEventListener("DOMContentLoaded", function() {
    const desktop = document.getElementById("desktop");
    const contextMenu = document.getElementById("context-menu");
    const fileSelector = document.getElementById("file-selector");
    const backgroundSelector = document.getElementById("background-selector");
    const taskbarIcons = document.getElementById("taskbar-icons");
    const clock = document.getElementById("clock");

    const changeBackgroundBtn = document.getElementById("change-background-btn");
    const changeColorBtn = document.getElementById("change-color-btn");
    const resetBtn = document.getElementById("reset-btn");

    let activeIcon = null;
    let activeWidget = null;
    let copiedURL = null;

    // Función para mostrar el menú contextual
    function showContextMenu(event) {
        event.preventDefault();
        contextMenu.style.top = event.clientY + "px";
        contextMenu.style.left = event.clientX + "px";
        contextMenu.style.display = "block";
        activeIcon = event.target.closest(".icon");
        activeWidget = event.target.closest(".widget");
    }

    // Función para ocultar el menú contextual
    function hideContextMenu() {
        contextMenu.style.display = "none";
    }

    // Evento de clic derecho en el escritorio para mostrar el menú contextual
    desktop.addEventListener("contextmenu", showContextMenu);

    // Evento de clic en cualquier lugar para ocultar el menú contextual
    document.addEventListener("click", hideContextMenu);

    // Función para agregar un icono al escritorio
    function addIcon(url, name, position = { top: '50px', left: '50px' }) {
        const icon = document.createElement("div");
        icon.classList.add("icon");
        icon.style.top = position.top;
        icon.style.left = position.left;
        icon.innerHTML = `<img src="${url}" alt="${name}"><span>${name}</span>`; // Agregar imagen y texto al icono
        icon.dataset.executable = url;
        icon.dataset.name = name;
        icon.draggable = true;
        desktop.appendChild(icon);

        icon.addEventListener("dblclick", function() {
            openFile(url, name);
        });

        icon.addEventListener("dragstart", function(event) {
            event.dataTransfer.setData("text/plain", JSON.stringify({
                id: icon.dataset.id,
                top: icon.style.top,
                left: icon.style.left
            }));
        });

        icon.addEventListener("dragend", function(event) {
            const rect = desktop.getBoundingClientRect();
            icon.style.top = `${event.clientY - rect.top - 32}px`;
            icon.style.left = `${event.clientX - rect.left - 32}px`;
            saveIcons();
        });

        addTaskbarIcon(url, name);
        saveIcons();
    }

    // Función para agregar un icono a la barra de tareas
    function addTaskbarIcon(url, name) {
        const taskbarIcon = document.createElement("div");
        taskbarIcon.classList.add("taskbar-icon");
        taskbarIcon.innerHTML = `<img src="${url}" alt="${name}" title="${name}">`;
        taskbarIcons.appendChild(taskbarIcon);

        taskbarIcon.addEventListener("click", function() {
            openFile(url, name);
        });

        taskbarIcon.addEventListener("contextmenu", function(event) {
            event.preventDefault();
            if (confirm(`¿Eliminar ${name} de la barra de tareas?`)) {
                taskbarIcons.removeChild(taskbarIcon);
            }
        });
    }

    // Función para abrir un archivo en una ventana
    function openFile(url, name) {
        const windowElement = document.createElement("div");
        windowElement.classList.add("window");
        windowElement.innerHTML = `
            <div class="window-header">
                <span class="window-title">${name}</span>
                <div class="window-controls">
                    <button class="minimize">_</button>
                    <button class="maximize">[ ]</button>
                    <button class="close">X</button>
                </div>
            </div>
            <div class="window-content">
                <iframe src="${url}" style="width: 100%; height: 100%;"></iframe>
            </div>
        `;
        desktop.appendChild(windowElement);

        // Event listeners for window controls
        const minimizeBtn = windowElement.querySelector(".minimize");
        const maximizeBtn = windowElement.querySelector(".maximize");
        const closeBtn = windowElement.querySelector(".close");

        minimizeBtn.addEventListener("click", function() {
            windowElement.style.display = "none";
        });

        maximizeBtn.addEventListener("click", function() {
            if (windowElement.classList.toggle("maximized")) {
                windowElement.style.width = "100%";
                windowElement.style.height = "100%";
                windowElement.style.top = "0";
                windowElement.style.left = "0";
            } else {
                windowElement.style.width = "400px";
                windowElement.style.height = "300px";
            }
        });

        closeBtn.addEventListener("click", function() {
            desktop.removeChild(windowElement);
        });

        // Drag functionality for windows
        const windowHeader = windowElement.querySelector(".window-header");
        windowHeader.addEventListener("mousedown", function(event) {
            const rect = windowElement.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const offsetY = event.clientY - rect.top;

            function moveWindow(event) {
                windowElement.style.top = `${event.clientY - offsetY}px`;
                windowElement.style.left = `${event.clientX - offsetX}px`;
            }

            function stopMoveWindow() {
                document.removeEventListener("mousemove", moveWindow);
                document.removeEventListener("mouseup", stopMoveWindow);
            }

            document.addEventListener("mousemove", moveWindow);
            document.addEventListener("mouseup", stopMoveWindow);
        });
    }

    // Función para agregar un widget flotante
    function addWidget() {
        const widget = document.createElement("div");
        widget.classList.add("widget");
        widget.innerHTML = `
            <div class="widget-content">
                <p>Este es un widget flotante. Puedes moverlo y redimensionarlo.</p>
            </div>
        `;
        desktop.appendChild(widget);

        // Drag functionality for widgets
        widget.addEventListener("mousedown", function(event) {
            const rect = widget.getBoundingClientRect();
            const offsetX = event.clientX - rect.left;
            const offsetY = event.clientY - rect.top;

            function moveWidget(event) {
                widget.style.top = `${event.clientY - offsetY}px`;
                widget.style.left = `${event.clientX - offsetX}px`;
            }

            function stopMoveWidget() {
                document.removeEventListener("mousemove", moveWidget);
                document.removeEventListener("mouseup", stopMoveWidget);
            }

            document.addEventListener("mousemove", moveWidget);
            document.addEventListener("mouseup", stopMoveWidget);
        });

        // Allow resizing the widget
        widget.style.resize = "both";
        widget.style.overflow = "auto";
    }

    // Función para guardar los iconos en el localStorage
    function saveIcons() {
        const icons = Array.from(document.querySelectorAll(".icon")).map(icon => ({
            url: icon.dataset.executable,
            name: icon.dataset.name,
            top: icon.style.top,
            left: icon.style.left
        }));
        localStorage.setItem("icons", JSON.stringify(icons));
    }

    // Función para cargar los iconos del localStorage
    function loadIcons() {
        const icons = JSON.parse(localStorage.getItem("icons")) || [];
        icons.forEach(icon => addIcon(icon.url, icon.name, { top: icon.top, left: icon.left }));
    }

function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const seconds = now.getSeconds().toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    const month = (now.getMonth() + 1).toString().padStart(2, "0"); // Se suma 1 porque los meses empiezan desde 0
    const year = now.getFullYear();

    clock.textContent = `${hours}:${minutes}:${seconds} - ${day}/${month}/${year}`;
}


    // Evento para seleccionar archivos desde el sistema
    fileSelector.addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const name = file.name;
            addIcon(url, name);
        }
    });

    // Evento para cambiar el fondo del escritorio
    changeBackgroundBtn.addEventListener("click", function() {
        backgroundSelector.click();
    });

    backgroundSelector.addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            desktop.style.backgroundImage = `url(${url})`;
            localStorage.setItem("background", url);
        }
    });

    // Evento para cambiar el color de los elementos del escritorio
    changeColorBtn.addEventListener("click", function() {
        const color = prompt("Ingrese el color de los elementos del escritorio (en formato hexadecimal o nombre de color):", "#f0f0f0");
        if (color) {
            document.querySelectorAll(".icon").forEach(icon => {
                icon.style.backgroundColor = color;
            });
            localStorage.setItem("iconColor", color);
        }
    });

    // Evento para reiniciar el localStorage
    resetBtn.addEventListener("click", function() {
        if (confirm("¿Está seguro de que desea reiniciar el escritorio? Esta acción eliminará todos los iconos y el fondo.")) {
            localStorage.clear();
            location.reload();
        }
    });

    // Evento para agregar una URL como acceso directo
    document.getElementById("add-url").addEventListener("click", function() {
        const url = prompt("Ingrese la URL del acceso directo:");
        if (url) {
            const name = prompt("Ingrese el nombre del acceso directo:");
            if (name) {
                addIcon(url, name);
            }
        }
    });

    // Evento para editar la URL de un icono
    document.getElementById("edit-url").addEventListener("click", function() {
        if (activeIcon) {
            const newUrl = prompt("Ingrese la nueva URL:", activeIcon.dataset.executable);
            if (newUrl) {
                activeIcon.dataset.executable = newUrl;
                activeIcon.querySelector("img").src = newUrl;
                saveIcons();
            }
        }
    });

    // Evento para renombrar un icono
    document.getElementById("rename").addEventListener("click", function() {
        if (activeIcon) {
            const newName = prompt("Ingrese el nuevo nombre:", activeIcon.dataset.name);
            if (newName) {
                activeIcon.dataset.name = newName;
                activeIcon.querySelector("span").textContent = newName;
                saveIcons();
            }
        }
    });

    // Evento para eliminar un icono
    document.getElementById("delete").addEventListener("click", function() {
        if (activeIcon) {
            desktop.removeChild(activeIcon);
            saveIcons();
        }
    });

    // Evento para mostrar propiedades del icono
    document.getElementById("properties").addEventListener("click", function() {
        if (activeIcon) {
            alert(`Nombre: ${activeIcon.dataset.name}\nURL: ${activeIcon.dataset.executable}`);
        }
    });

    // Evento para agregar un widget
    document.getElementById("add-widget").addEventListener("click", function() {
        addWidget();
    });

    // Evento para cerrar un widget
    document.getElementById("close-widget").addEventListener("click", function() {
        if (activeWidget) {
            desktop.removeChild(activeWidget);
        }
    });

    // Evento para copiar la URL de un icono
    document.getElementById("copy-url").addEventListener("click", function() {
        if (activeIcon) {
            copiedURL = activeIcon.dataset.executable;
            alert("URL copiada: " + copiedURL);
        }
    });

    // Evento para pegar la URL como un nuevo icono
    document.getElementById("paste-url").addEventListener("click", function() {
        if (copiedURL) {
            const name = prompt("Ingrese el nombre del nuevo acceso directo:");
            if (name) {
                addIcon(copiedURL, name);
            }
        } else {
            alert("No hay URL copiada.");
        }
    });

    // Cargar el fondo del escritorio del localStorage
    const savedBackground = localStorage.getItem("background");
    if (savedBackground) {
        desktop.style.backgroundImage = `url(${savedBackground})`;
    }

    // Cargar los iconos del localStorage
    loadIcons();

    // Actualizar el reloj cada segundo
    setInterval(updateClock, 1000);
    updateClock();
});
