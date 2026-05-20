// Traduções PT-BR e EN
export const translations = {
  pt: {
    // Auth - Login
    loginTitle: 'Bem-vindo',
    loginSubtitle: 'Acesse sua conta para continuar.',
    registerTitle: 'Criar Conta',
    registerSubtitle: 'Cadastre-se para começar a gerenciar seus pacientes.',

    // Auth - Left panel
    headline1: 'Nutrição inteligente,',
    headline2: 'resultados reais.',
    subtext: 'Plataforma completa para nutricionistas gerenciarem pacientes, consultas e planos alimentares com eficiência e praticidade.',
    feature1: 'Cadastro e acompanhamento de pacientes',
    feature2: 'Geração de planos alimentares personalizados',
    feature3: 'Histórico de consultas e evolução clínica',
    feature4: 'Dados seguros com criptografia ponta a ponta',

    // Form labels
    fullName: 'Nome Completo',
    fullNamePlaceholder: 'Seu nome completo',
    email: 'E-mail',
    emailPlaceholder: 'seu@email.com',
    password: 'Senha',
    passwordPlaceholder: 'Mínimo 6 caracteres',
    confirmPassword: 'Confirmar Senha',
    confirmPasswordPlaceholder: 'Repita sua senha',

    // Buttons
    signIn: 'Entrar',
    signUp: 'Criar conta',
    clearSession: 'Limpar sessão',
    signOut: 'Sair',
    or: 'ou',

    // Footer links
    hasAccount: 'Já tem conta?',
    login: 'Faça login',
    noAccount: 'Não tem conta?',
    register: 'Cadastre-se',

    // Errors
    passwordMismatch: 'As senhas não coincidem.',
    passwordTooShort: 'A senha deve ter no mínimo 6 caracteres.',
    unexpectedError: 'Ocorreu um erro inesperado.',

    // Dashboard
    greeting: (name: string) => `Olá, ${name}! 👋`,
    dashboardSubtitle: 'Aqui está um resumo do seu consultório.',
    patients: 'Pacientes',
    consultations: 'Consultas',
    activePlans: 'Planos Ativos',
    evolution: 'Evolução',
    modulesInDev: 'Módulos em desenvolvimento',
    modulesInDevSub: 'Em breve você poderá gerenciar seus pacientes, consultas e planos alimentares aqui.',
    loading: 'Carregando...',
    menuDashboard: 'Dashboard',
    menuPatients: 'Pacientes',
    cardActivePatients: 'Pacientes Ativos',
    cardWeeklyConsultations: 'Consultas da Semana',
    cardNoReturn: 'Pacientes sem Retorno',
    noPatientsNoReturn: 'Nenhum paciente sem retorno no momento',
    days: 'dias',
    ago: 'atrás',
    lastConsultation: 'última consulta há',
    weeklyConsultationsSubtitle: 'agendadas para esta semana',
  },
  en: {
    // Auth - Login
    loginTitle: 'Welcome',
    loginSubtitle: 'Sign in to your account to continue.',
    registerTitle: 'Create Account',
    registerSubtitle: 'Sign up to start managing your patients.',

    // Auth - Left panel
    headline1: 'Smart nutrition,',
    headline2: 'real results.',
    subtext: 'A complete platform for nutritionists to manage patients, appointments and meal plans efficiently.',
    feature1: 'Patient registration and follow-up',
    feature2: 'Personalized meal plan generation',
    feature3: 'Appointment history and clinical evolution',
    feature4: 'Secure data with end-to-end encryption',

    // Form labels
    fullName: 'Full Name',
    fullNamePlaceholder: 'Your full name',
    email: 'Email',
    emailPlaceholder: 'you@email.com',
    password: 'Password',
    passwordPlaceholder: 'Minimum 6 characters',
    confirmPassword: 'Confirm Password',
    confirmPasswordPlaceholder: 'Repeat your password',

    // Buttons
    signIn: 'Sign In',
    signUp: 'Create account',
    clearSession: 'Clear session',
    signOut: 'Sign out',
    or: 'or',

    // Footer links
    hasAccount: 'Already have an account?',
    login: 'Sign in',
    noAccount: "Don't have an account?",
    register: 'Sign up',

    // Errors
    passwordMismatch: 'Passwords do not match.',
    passwordTooShort: 'Password must be at least 6 characters.',
    unexpectedError: 'An unexpected error occurred.',

    // Dashboard
    greeting: (name: string) => `Hello, ${name}! 👋`,
    dashboardSubtitle: "Here's a summary of your practice.",
    patients: 'Patients',
    consultations: 'Appointments',
    activePlans: 'Active Plans',
    evolution: 'Evolution',
    modulesInDev: 'Modules in development',
    modulesInDevSub: 'Soon you will be able to manage your patients, appointments and meal plans here.',
    loading: 'Loading...',
    menuDashboard: 'Dashboard',
    menuPatients: 'Patients',
    cardActivePatients: 'Active Patients',
    cardWeeklyConsultations: 'Weekly Consultations',
    cardNoReturn: 'Patients without Return',
    noPatientsNoReturn: 'No patients without return at the moment',
    days: 'days',
    ago: 'ago',
    lastConsultation: 'last consultation',
    weeklyConsultationsSubtitle: 'scheduled for this week',
  },
};

export type Locale = 'pt' | 'en';
export type Translations = typeof translations.pt;

export function getLocale(): Locale {
  const lang = navigator.language || navigator.languages?.[0] || 'pt';
  return lang.toLowerCase().startsWith('pt') ? 'pt' : 'en';
}

export function useTranslations(): Translations {
  const locale = getLocale();
  return translations[locale];
}
