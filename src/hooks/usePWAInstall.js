import { useState, useEffect } from 'react';

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [isInstallable, setIsInstallable] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            // Previene que Chrome 67 o anterior muestre automáticamente la barra de instalación
            e.preventDefault();
            // Guarda el evento para poder dispararlo luego cuando el usuario le dé clic al botón
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // Limpiar el evento si se desmonta o cambia de página
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) return;

        // Muestra el prompt de instalación nativo
        deferredPrompt.prompt();

        // Espera a que el usuario responda
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('El usuario aceptó instalar RifaPro PWA');
        } else {
            console.log('El usuario rechazó instalar RifaPro PWA');
        }

        // Ya no se puede volver a usar este evento guardado
        setDeferredPrompt(null);
        setIsInstallable(false);
    };

    return { isInstallable, promptInstall };
}
