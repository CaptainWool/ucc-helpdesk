export interface TranslationSet {
    nav_home: string;
    nav_submit: string;
    nav_track: string;
    nav_faq: string;
    nav_login: string;
    nav_logout: string;
    hero_title: string;
    hero_subtitle: string;
    btn_submit: string;
    btn_track: string;
    footer_rights: string;
    status_open: string;
    status_resolved: string;
}

export type LanguageCode = 'en' | 'fr' | 'tw';

export const translations: Record<LanguageCode, TranslationSet> = {
    en: {
        nav_home: "Home",
        nav_submit: "Submit Ticket",
        nav_track: "Track Ticket",
        nav_faq: "FAQ",
        nav_login: "Admin Login",
        nav_logout: "Logout",
        hero_title: "Student Support Helpdesk",
        hero_subtitle: "Fast, efficient support for all your academic and administrative needs.",
        btn_submit: "Submit a Ticket",
        btn_track: "Track Status",
        footer_rights: "All rights reserved",
        status_open: "Open",
        status_resolved: "Resolved"
    },
    fr: {
        nav_home: "Accueil",
        nav_submit: "Soumettre un Ticket",
        nav_track: "Suivre un Ticket",
        nav_faq: "FAQ",
        nav_login: "Connexion Admin",
        nav_logout: "Déconnexion",
        hero_title: "Assistance Étudiant",
        hero_subtitle: "Support rapide et efficace pour tous vos besoins académiques et administratifs.",
        btn_submit: "Soumettre un Ticket",
        btn_track: "Suivre le Statut",
        footer_rights: "Tous droits réservés",
        status_open: "Ouvert",
        status_resolved: "Résolu"
    },
    tw: {
        nav_home: "Fie",
        nav_submit: "Fa Asem To Gua",
        nav_track: "Hwe Wo Asem",
        nav_faq: "Nsem A Wotaa Bisa",
        nav_login: "Admin Login",
        nav_logout: "Pue",
        hero_title: "Sukuufo Mmoabea",
        hero_subtitle: "Mmoa a ewo ha ma wo adesua ne nneema nyinaa.",
        btn_submit: "Fa Asem To Gua",
        btn_track: "Hwe Nea Ekanya",
        footer_rights: "Yekura kyefa nyinaa",
        status_open: "Ebue",
        status_resolved: "Asiesie"
    }
};
