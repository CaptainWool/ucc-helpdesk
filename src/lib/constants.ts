export interface GroupedFAQ {
    category: string;
    items: {
        question: string;
        answer: string;
    }[];
}

export const FAQS: GroupedFAQ[] = [
    {
        category: 'Student Portal & Registration',
        items: [
            {
                question: 'I cannot log in to my portal. What should I do?',
                answer: 'First, ensure you are using your correct Student ID and password. If you have forgotten your password, use the "Forgot Password" link on the portal login page. If the issue persists, submit a ticket here with "Portal / Login Issue" as the type.'
            },
            {
                question: 'How do I register my courses for the semester?',
                answer: 'Log in to your portal, navigate to "Course Registration," select the appropriate semester, and follow the prompts. Ensure you click "Submit" at the end to confirm your registration.'
            },
            {
                question: 'My courses are not showing up after registration.',
                answer: 'Course registration can take up to 24 hours to reflect in all systems. If you just registered, please wait. If it has been longer than 24 hours, check with your department coordinator or submit a ticket.'
            }
        ]
    },
    {
        category: 'Fees & Payments',
        items: [
            {
                question: 'Which banks are authorized for UCC fee payments?',
                answer: 'Authorized banks include Prudential Bank, Zenith Bank, Consolidated Bank Ghana (CBG), and GCB Bank. Always use your Student ID as the reference on the deposit slip.'
            },
            {
                question: 'I paid my fees but it is not reflecting on my portal.',
                answer: 'Fee payments at authorized banks are usually updated within 24 hours. If it has been longer, please submit a ticket and include a clear photo of your bank receipt and your student ID.'
            },
            {
                question: 'Are there deadlines for fee payments?',
                answer: 'Yes. Students are generally required to pay at least 50% of fees to register for the semester and 100% to sit for examinations. Check the UCC Academic Calendar for specific dates.'
            }
        ]
    },
    {
        category: 'Academic & CoDE Specific',
        items: [
            {
                question: 'How do I handle an "IC" (Incomplete) grade?',
                answer: 'An "IC" grade usually means a component of your assessment (either CA or Exam) is missing. Report this immediately to your regional or study center coordinator, or submit a ticket with your index number and the course code.'
            },
            {
                question: 'Where can I access my study modules?',
                answer: 'Hard copies of modules are distributed at your study centers. Electronic versions (E-Modules) are available on the UCC Learning Management System (LMS) and the CoDE official app.'
            },
            {
                question: 'How can I change my study center?',
                answer: 'To change your study center, you must submit a formal application through your current regional office to the Director of CoDE. This process is typically handled before the start of a new semester.'
            },
            {
                question: 'How do I check my GPA/Results?',
                answer: 'Your semester results and cumulative GPA are available on your Student Portal under the "Academic Results" or "Statement of Result" tab.'
            }
        ]
    },
    {
        category: 'ID Cards & Certificates',
        items: [
            {
                question: 'I have not received my Student ID card. What should I do?',
                answer: 'ID cards are usually distributed through the regional offices. If you are a new student and yours is not ready, ensure you have uploaded a proper passport-sized photo on your portal. For replacements, a processing fee applies.'
            }
        ]
    }
];
