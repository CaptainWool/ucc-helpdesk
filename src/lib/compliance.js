
/**
 * Compliance and Dark Pattern Prevention Utilities
 */

/**
 * Checks an element for basic accessibility compliance
 * @param {HTMLElement} element - The root element to check
 * @returns {Array} List of accessibility issues
 */
export const checkAccessibility = (element) => {
    const issues = [];

    if (!element) return issues;

    // Check images for alt text
    const images = element.querySelectorAll('img');
    images.forEach((img, index) => {
        if (!img.alt && img.getAttribute('role') !== 'presentation') {
            issues.push({
                type: 'accessibility',
                severity: 'high',
                element: `img-${index}`,
                message: 'Image missing alt text'
            });
        }
    });

    // Check buttons for accessible names
    const buttons = element.querySelectorAll('button');
    buttons.forEach((btn, index) => {
        const text = btn.innerText || btn.getAttribute('aria-label') || btn.getAttribute('title');
        if (!text || text.trim() === '') {
            issues.push({
                type: 'accessibility',
                severity: 'high',
                element: `btn-${index}`,
                message: 'Button missing accessible label'
            });
        }
    });

    // Check form inputs for labels
    const inputs = element.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
        const id = input.id;
        if (id) {
            const label = element.querySelector(`label[for="${id}"]`);
            if (!label && !input.getAttribute('aria-label')) {
                issues.push({
                    type: 'accessibility',
                    severity: 'medium',
                    element: `input-${id || index}`,
                    message: 'Form input missing associated label'
                });
            }
        } else if (!input.getAttribute('aria-label')) {
            issues.push({
                type: 'accessibility',
                severity: 'medium',
                element: `input-${index}`,
                message: 'Form input missing ID and label'
            });
        }
    });

    return issues;
};

/**
 * Detects potential dark patterns in text content
 * @param {string} text - The content to analyze
 * @returns {Array} List of detected patterns
 */
export const detectDarkPatterns = (text) => {
    const patterns = [];
    const lowerText = text.toLowerCase();

    const darkPatternRules = [
        {
            name: 'False Urgency',
            regex: /\b(hurry|limited time|act now|running out|exclusive offer|don't miss out|last chance|expired)\b/i,
            message: 'Creates artificial pressure on the user.'
        },
        {
            name: 'Confirmshaming',
            regex: /\b(no thanks, i.*hate|i don't want to save|i'll pay full price|not interested in helping|refuse help)\b/i,
            message: 'Uses guilt to influence user choice.'
        },
        {
            name: 'Forced Action',
            regex: /\b(must.*agree|required to.*continue|cannot proceed without|agree to all)\b/i,
            message: 'Forces user to perform an action they might not want.'
        },
        {
            name: 'Nagging',
            regex: /\b(still there\?|hello\?|respond now|why haven't you.*|ignoring me)\b/i,
            message: 'Repeatedly asks user to perform an action.'
        },
        {
            name: 'Misdirection',
            regex: /\b(not what you're looking for|ignore this|don't click here)\b/i,
            message: 'Distracts from the user\'s actual goal.'
        }
    ];

    darkPatternRules.forEach(rule => {
        if (rule.regex.test(lowerText)) {
            patterns.push({
                type: 'dark-pattern',
                name: rule.name,
                message: rule.message,
                severity: rule.name === 'Forced Action' ? 'high' : 'medium'
            });
        }
    });

    return patterns;
};

/**
 * Calculates a generic compliance health score (0-100)
 * @param {Array} issues - Combined list of accessibility and dark pattern issues
 * @returns {number} Score from 0 to 100
 */
export const calculateHealthScore = (issues) => {
    if (!issues || issues.length === 0) return 100;

    const penaltyPerHigh = 15;
    const penaltyPerMedium = 5;

    const totalPenalty = issues.reduce((acc, issue) => {
        return acc + (issue.severity === 'high' ? penaltyPerHigh : penaltyPerMedium);
    }, 0);

    return Math.max(0, 100 - totalPenalty);
};


/**
 * Generates a GDPR-compliant data export for a user
 * @param {object} userData - Full user profile and activity data
 * @returns {Blob} JSON blob of user data
 */
export const generateDataExport = (userData) => {
    const exportData = {
        meta: {
            exportDate: new Date().toISOString(),
            platform: 'UCC Helpdesk',
            compliance: 'GDPR/CCPA'
        },
        user: userData.profile,
        activity: {
            tickets: userData.tickets,
            messages: userData.messages
        }
    };

    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
};
