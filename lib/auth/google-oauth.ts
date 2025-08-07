// Google OAuth integration for Gmail access
import { google } from 'googleapis';
import { prisma } from '../prisma';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

// Required Gmail scopes
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/userinfo.email',
];

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn('⚠️ Google OAuth credentials not configured');
  console.warn('🔧 Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables');
}

/**
 * Create Google OAuth2 client
 */
export function createGoogleOAuth2Client() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
}

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthUrl(userId: string): string {
  const oauth2Client = createGoogleOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GMAIL_SCOPES,
    prompt: 'consent', // Force consent to get refresh token
    state: userId, // Pass user ID for callback
  });
}

/**
 * Exchange authorization code for tokens and store in database
 */
export async function exchangeGoogleAuthCode(
  code: string,
  userId: string
): Promise<{ success: boolean; error?: string; email?: string }> {
  try {
    console.log('🔄 Exchanging Google auth code for tokens...');
    
    const oauth2Client = createGoogleOAuth2Client();
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }
    
    // Set credentials to get user info
    oauth2Client.setCredentials(tokens);
    
    // Get user's email address
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    const email = userInfo.data.email;
    if (!email) {
      throw new Error('Could not retrieve user email from Google');
    }
    
    console.log('📧 Retrieved user email:', email);
    
    // Calculate token expiry
    const expiresAt = tokens.expiry_date 
      ? new Date(tokens.expiry_date) 
      : new Date(Date.now() + 3600 * 1000);
    
    // Store in database (upsert in case user reconnects)
    await prisma.connectedEmailAccount.upsert({
      where: { email },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt,
        isActive: true,
        lastUsed: new Date(),
        updatedAt: new Date()
      },
      create: {
        userId,
        email,
        provider: 'GMAIL',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt,
        isActive: true,
        lastUsed: new Date()
      }
    });
    
    console.log('✅ Google account connected successfully');
    return { success: true, email };
    
  } catch (error) {
    console.error('💥 Google OAuth error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Google OAuth failed' 
    };
  }
}

/**
 * Refresh Google access token
 */
export async function refreshGoogleToken(emailAccountId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔄 Refreshing Google access token...');
    
    // Get email account from database
    const emailAccount = await prisma.connectedEmailAccount.findUnique({
      where: { id: emailAccountId }
    });
    
    if (!emailAccount || !emailAccount.refreshToken) {
      throw new Error('Email account or refresh token not found');
    }
    
    const oauth2Client = createGoogleOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: emailAccount.refreshToken
    });
    
    // Refresh the token
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }
    
    // Calculate new expiry
    const expiresAt = credentials.expiry_date 
      ? new Date(credentials.expiry_date) 
      : new Date(Date.now() + 3600 * 1000);
    
    // Update database with new token
    await prisma.connectedEmailAccount.update({
      where: { id: emailAccountId },
      data: {
        accessToken: credentials.access_token,
        expiresAt,
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Google access token refreshed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('💥 Google token refresh error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Token refresh failed' 
    };
  }
}

/**
 * Get valid Google OAuth2 client for an email account
 */
export async function getGoogleClientForAccount(emailAccountId: string) {
  const emailAccount = await prisma.connectedEmailAccount.findUnique({
    where: { id: emailAccountId }
  });
  
  if (!emailAccount || emailAccount.provider !== 'GMAIL') {
    throw new Error('Gmail account not found');
  }
  
  // Check if token needs refresh
  const now = new Date();
  const expiresAt = emailAccount.expiresAt;
  const needsRefresh = !expiresAt || expiresAt <= new Date(now.getTime() + 5 * 60 * 1000); // 5 min buffer
  
  if (needsRefresh && emailAccount.refreshToken) {
    await refreshGoogleToken(emailAccountId);
    
    // Refetch updated account
    const updatedAccount = await prisma.connectedEmailAccount.findUnique({
      where: { id: emailAccountId }
    });
    
    if (!updatedAccount) {
      throw new Error('Failed to refresh Gmail account');
    }
    
    const oauth2Client = createGoogleOAuth2Client();
    oauth2Client.setCredentials({
      access_token: updatedAccount.accessToken,
      refresh_token: updatedAccount.refreshToken
    });
    
    return oauth2Client;
  }
  
  // Use existing token
  const oauth2Client = createGoogleOAuth2Client();
  oauth2Client.setCredentials({
    access_token: emailAccount.accessToken,
    refresh_token: emailAccount.refreshToken
  });
  
  return oauth2Client;
}

export default {
  getGoogleAuthUrl,
  exchangeGoogleAuthCode,
  refreshGoogleToken,
  getGoogleClientForAccount
};