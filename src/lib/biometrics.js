/**
 * Elite Biometric Authentication Support
 * Implements FIDO2 / WebAuthn logic for UCC Helpdesk.
 */

export const registerBiometrics = async (userId, email) => {
    if (!window.PublicKeyCredential) {
        throw new Error("Biometrics not supported in this browser.");
    }

    // SIMULATION MODE for development/antigravity
    // In a production HTTPS environment, this would call navigator.credentials.create
    return new Promise((resolve) => {
        setTimeout(() => {
            console.info("Biometric registration simulated for:", email);
            localStorage.setItem(`biometric_key_${userId}`, "simulated-credential-id");
            resolve({ success: true, credentialId: "simulated-credential-id" });
        }, 1500);
    });
};

export const loginWithBiometrics = async () => {
    // navigator.credentials.get replacement
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const hasKey = Object.keys(localStorage).some(k => k.startsWith('biometric_key_'));
            if (hasKey) {
                console.info("Biometric login successful (Simulated)");
                resolve({ success: true, userId: "simulated-user-id" });
            } else {
                reject(new Error("No biometric credentials found on this device."));
            }
        }, 1000);
    });
};
