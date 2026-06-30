import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

export interface GoogleProfile {
  id: string;
  displayName: string;
  emails: { value: string }[];
  photos: { value: string }[];
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'PLACEHOLDER_NOT_CONFIGURED',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'PLACEHOLDER_NOT_CONFIGURED',
      callbackURL: `${process.env.API_URL || 'http://localhost:4000'}/api/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ) {
    const { id, displayName, emails, photos } = profile;
    done(null, {
      googleId: id,
      email: emails[0].value,
      name: displayName,
      photo: photos[0]?.value,
    });
  }
}
