const { app, Menu } = require('electron');

const setMainMenu = (mainWindow) => {
    // Establecer explícitamente el nombre de la aplicación si es necesario

    const template = [
        {
            label: app.name,
            submenu: [
                { role: 'about' },
                { type: 'separator' },
                { role: 'services' },
                { type: 'separator' },
                { role: 'hide' },
                { role: 'hideothers' },
                { role: 'unhide' },
                { type: 'separator' },
                { role: 'quit' }
            ]
        },
        {
            label: 'Tema',
            submenu: [
                { label: 'Claro',
                    click: () => {
                        mainWindow.webContents.send('cambiar-tema', 'claro');
                    }
                },
                { label: 'Oscuro',
                    click: () => {
                        mainWindow.webContents.send('cambiar-tema', 'oscuro');
                    }
                }
            ]
        },
        // View menu
        {
            label: 'Ver',
            submenu: [
                { role: 'reload' },
                { role: 'forcereload' },
                { role: 'toggledevtools' },
                { type: 'separator' },
                { role: 'resetzoom' },
                { role: 'zoomin' },
                { role: 'zoomout' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
    ];
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};

module.exports = { setMainMenu };
