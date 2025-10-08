export default {
  // Profile and account
  profile: 'Profile',
  myProfile: 'My Profile',
  account: 'Account',
  myAccount: 'My Account',

  // Authentication actions
  login: 'Login',
  logout: 'Logout',
  signup: 'Sign Up',
  signin: 'Sign In',
  signIn: 'Sign In',
  signout: 'Sign Out',
  createAccountButton: 'Create account',

  // Authentication forms
  email: 'Email',
  password: 'Password',
  confirmPassword: 'Confirm Password',
  rememberMe: 'Remember Me',
  forgotPassword: 'Forgot Password?',

  // Authentication states
  welcome: 'Welcome',
  welcomeBack: 'Welcome back',
  pleaseSignIn: 'Please sign in to your account',
  signInToAccount: 'Sign in to your account',
  createAccount: 'Create your account',
  getStarted: 'Get started with your free account',
  alreadyHaveAccount: 'Already have an account?',
  dontHaveAccount: "Don't have an account?",
  startFreeTrial: 'Start your 14-day free trial',

  // Form placeholders
  emailPlaceholder: 'Enter your business email',
  passwordPlaceholder: 'Enter your password',
  fullNamePlaceholder: 'Full name',
  firstNamePlaceholder: 'First name',
  lastNamePlaceholder: 'Last name',
  confirmPasswordPlaceholder: 'Confirm password',
  passwordMinPlaceholder: 'Password (min. 8 characters)',

  // Form labels
  fullName: 'Full name',
  firstName: 'First name',
  lastName: 'Last name',

  // Password actions
  resetPassword: 'Reset it here',

  // Errors
  invalidCredentials: 'Invalid credentials',
  emailRequired: 'Email is required',
  passwordRequired: 'Password is required',
  passwordsDontMatch: "Passwords don't match",
  inactiveUser:
    'Your account has been deactivated. Please contact your organization administrator.',
  accountDeactivated: 'Account Deactivated',
  inactiveUserHelp:
    'Contact your organization administrator to reactivate your account. They can restore your access through the team management panel.',
  contactSupport: 'Contact Support',
  backToLogin: 'Back to Login',
  needHelp: 'Need help?',
  contactUs: 'Contact us',

  // OTP related errors
  otpExpired: 'Your verification code has expired. Please request a new one.',
  otpInvalid: 'The verification code you entered is incorrect. Please check and try again.',
  verificationFailed: 'Email verification failed. Please try again.',

  // Success messages
  loginSuccess: 'Successfully logged in',
  logoutSuccess: 'Successfully logged out',

  // Account settings
  changePassword: 'Change Password',
  updateProfile: 'Update Profile',
  accountSettings: 'Account Settings',

  // Social authentication
  continueWithGoogle: 'Continue with Google',
  signInWithGoogle: 'Sign in with Google',
  signUpWithGoogle: 'Sign up with Google',

  // Team invitations
  joinTeam: 'Join {{companyName}} Team',
  joinTeamDescription:
    'You have been invited to join by {{inviterName}}. Please set your password to complete your account setup.',
  invalidInvitation: 'Invalid Invitation',
  invitationExpiredOrInvalid:
    'This invitation link is invalid or has expired. Please contact your team administrator for a new invitation.',

  // Dividers
  or: 'or',

  // Password strength
  passwordStrength: 'Password strength',
  weak: 'Weak',
  fair: 'Fair',
  good: 'Good',
  strong: 'Strong',
  veryStrong: 'Very Strong',

  // Password requirements
  charactersMin: '8+ characters',
  uppercase: 'Uppercase',
  lowercase: 'Lowercase',
  numbers: 'Numbers',

  // Form validation errors from zod schema
  nameRequired: 'Name is required',
  firstNameRequired: 'First name is required',
  lastNameRequired: 'Last name is required',
  invalidEmail: 'Invalid email',
  passwordMinLength: 'Password must be at least 8 characters',
  confirmPasswordRequired: 'Please confirm your password',

  // Notifications
  signUpFailed: 'Sign Up Failed',
  failedToCreateAccount: 'Failed to create account',
  failedToSendVerificationCode: 'Failed to send verification code',
  emailAlreadyExists: 'An account with this email already exists',
  success: 'Success',
  accountCreatedSuccess:
    'Account created successfully! Please check your email to verify your account.',
  error: 'Error',
  unexpectedError: 'An unexpected error occurred',
  failedGoogleSignUp: 'Failed to sign up with Google',
}
