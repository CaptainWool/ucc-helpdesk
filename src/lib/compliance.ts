/**
 * Compliance and Dark Pattern Prevention Utilities
 */

export interface ComplianceIssue {
    type: string;
    severity: 'high' | 'medium' | 'low';
    element: string;
    message: string;
}

export interface DarkPatternInfo {
    type: 'dark-pattern';
    name: string;
    message: string;
    severity: 'high' | 'medium' | 'low';
}

export interface DarkPatternRule {
    name: string;
    regex: RegExp;
    message: string;
}

/**
 * Checks an element for basic accessibility compliance
 */
export const checkAccessibility = (element: HTMLElement | null): ComplianceIssue[] => {
    const issues: ComplianceIssue[] = [];

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
        const inputEl = input as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        const id = inputEl.id;
        if (id) {
            const label = element.querySelector(`label[for="${id}"]`);
            if (!label && !inputEl.getAttribute('aria-label')) {
                issues.push({
                    type: 'accessibility',
                    severity: 'medium',
                    element: `input-${id || index}`,
                    message: 'Form input missing associated label'
                });
            }
        } else if (!inputEl.getAttribute('aria-label')) {
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
 */
export const detectDarkPatterns = (text: string): DarkPatternInfo[] => {
    const patterns: DarkPatternInfo[] = [];
    const lowerText = text.toLowerCase();

    const darkPatternRules: DarkPatternRule[] = [
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
 */
export const calculateHealthScore = (issues: (ComplianceIssue | DarkPatternInfo)[]): number => {
    if (!issues || issues.length === 0) return 100;

    const penaltyPerHigh = 15;
    const penaltyPerMedium = 5;

    const totalPenalty = issues.reduce((acc, issue) => {
        return acc + (issue.severity === 'high' ? penaltyPerHigh : penaltyPerMedium);
    }, 0);

    return Math.max(0, 100 - totalPenalty);
};

export interface UserExportData {
    profile: any;
    tickets: any[];
    messages: any[];
}

/**
 * Generates a GDPR-compliant data export for a user
 */
export const generateDataExport = (userData: UserExportData): Blob => {
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
