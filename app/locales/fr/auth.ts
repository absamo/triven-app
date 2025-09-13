export default {
    // Profile and account
    profile: 'Profil',
    myProfile: 'Mon Profil',
    account: 'Compte',
    myAccount: 'Mon Compte',

    // Authentication actions
    login: 'Connexion',
    logout: 'Déconnexion',
    signup: 'S\'inscrire',
    signin: 'Se Connecter',
    signIn: 'Se Connecter',
    signout: 'Se Déconnecter',
    createAccountButton: 'Créer un compte',

    // Authentication forms
    email: 'E-mail',
    password: 'Mot de Passe',
    confirmPassword: 'Confirmer le Mot de Passe',
    rememberMe: 'Se Souvenir de Moi',
    forgotPassword: 'Mot de Passe Oublié?',

    // Authentication states
    welcome: 'Bienvenue',
    welcomeBack: 'Ravi de vous revoir',
    pleaseSignIn: 'Veuillez vous connecter à votre compte',
    signInToAccount: 'Connectez-vous à votre compte',
    createAccount: 'Créez votre compte',
    getStarted: 'Commencez avec votre compte gratuit',
    alreadyHaveAccount: 'Vous avez déjà un compte?',
    dontHaveAccount: "Vous n'avez pas de compte?",
    startFreeTrial: 'Commencez votre essai gratuit de 14 jours',

    // Form placeholders
    emailPlaceholder: 'Entrez votre e-mail professionnel',
    passwordPlaceholder: 'Entrez votre mot de passe',
    fullNamePlaceholder: 'Nom complet',
    firstNamePlaceholder: 'Prénom',
    lastNamePlaceholder: 'Nom',
    confirmPasswordPlaceholder: 'Confirmez le mot de passe',
    passwordMinPlaceholder: 'Mot de passe (min. 8 caractères)',

    // Form labels
    fullName: 'Nom complet',
    firstName: 'Prénom',
    lastName: 'Nom',

    // Password actions
    resetPassword: 'Réinitialisez-le ici',

    // Errors
    invalidCredentials: 'Identifiants invalides',
    emailRequired: 'L\'e-mail est requis',
    passwordRequired: 'Le mot de passe est requis',
    passwordsDontMatch: "Les mots de passe ne correspondent pas",
    confirmPasswordRequired: 'Veuillez confirmer votre mot de passe',
    inactiveUser: 'Votre compte a été désactivé. Veuillez contacter l\'administrateur de votre organisation.',
    accountDeactivated: 'Compte Désactivé',
    inactiveUserHelp: 'Contactez l\'administrateur de votre organisation pour réactiver votre compte. Il peut restaurer votre accès via le panneau de gestion d\'équipe.',
    contactSupport: 'Contacter le Support',
    backToLogin: 'Retour à la Connexion',
    needHelp: 'Besoin d\'aide?',
    contactUs: 'Nous contacter',

    // OTP related errors
    otpExpired: 'Votre code de vérification a expiré. Veuillez en demander un nouveau.',
    otpInvalid: 'Le code de vérification que vous avez saisi est incorrect. Veuillez vérifier et réessayer.',
    verificationFailed: 'La vérification de l\'e-mail a échoué. Veuillez réessayer.',

    // Success messages
    loginSuccess: 'Connexion réussie',
    logoutSuccess: 'Déconnexion réussie',

    // Account settings
    changePassword: 'Changer le Mot de Passe',
    updateProfile: 'Mettre à Jour le Profil',
    accountSettings: 'Paramètres du Compte',

    // Social authentication
    continueWithGoogle: 'Continuer avec Google',
    signInWithGoogle: 'Se connecter avec Google',
    signUpWithGoogle: 'S\'inscrire avec Google',

    // Team invitations
    joinTeam: 'Rejoindre l\'Équipe de {{companyName}}',
    joinTeamDescription: 'Vous avez été invité(e) à rejoindre par {{inviterName}}. Veuillez définir votre mot de passe pour terminer la configuration de votre compte.',
    invalidInvitation: 'Invitation Invalide',
    invitationExpiredOrInvalid: 'Ce lien d\'invitation est invalide ou a expiré. Veuillez contacter votre administrateur d\'équipe pour une nouvelle invitation.',

    // Dividers
    or: 'ou',

    // Password strength
    passwordStrength: 'Force du mot de passe',
    weak: 'Faible',
    fair: 'Correct',
    good: 'Bon',
    strong: 'Fort',
    veryStrong: 'Très Fort',

    // Password requirements
    charactersMin: '8+ caractères',
    uppercase: 'Majuscule',
    lowercase: 'Minuscule',
    numbers: 'Chiffres',

    // Form validation errors from zod schema
    nameRequired: 'Le nom est requis',
    firstNameRequired: 'Le prénom est requis',
    lastNameRequired: 'Le nom est requis',
    invalidEmail: 'E-mail invalide',
    passwordMinLength: 'Le mot de passe doit contenir au moins 8 caractères',


    // Notifications
    signUpFailed: 'Inscription Échouée',
    failedToCreateAccount: 'Échec de la création du compte',
    failedToSendVerificationCode: 'Échec de l\'envoi du code de vérification',
    emailAlreadyExists: 'Un compte avec cet e-mail existe déjà',
    success: 'Succès',
    accountCreatedSuccess: 'Compte créé avec succès! Veuillez vérifier votre e-mail pour confirmer votre compte.',
    error: 'Erreur',
    unexpectedError: 'Une erreur inattendue s\'est produite',
    failedGoogleSignUp: 'Échec de l\'inscription avec Google',
} satisfies typeof import("../en/auth").default;
