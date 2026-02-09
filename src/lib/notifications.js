/**
 * Browser Notification Utility
 */

export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
        return false;
    }

    if (Notification.permission === "granted") {
        return true;
    }

    if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
    }

    return false;
};

export const sendNotification = (title, options = {}) => {
    if (Notification.permission === "granted") {
        const notification = new Notification(title, {
            icon: '/logo192.png', // Fallback to a default icon if available
            badge: '/logo192.png',
            ...options
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };

        return notification;
    }
    return null;
};
