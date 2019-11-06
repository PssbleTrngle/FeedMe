import express from 'express';
import Service from '../service';
import ClientOAuth2 from 'client-oauth2';

const random = require('random-sentence');

class Reddit extends Service {

	createOAuth(): ClientOAuth2 {
		return new ClientOAuth2({
			clientId: 'WIgree3v3c3SbQ',
			clientSecret: 'bO6zPP8h8F_c7CfL3llt2hhEFdU',
			accessTokenUri: 'https://www.reddit.com/api/v1/access_token',
			authorizationUri: 'https://www.reddit.com/api/v1/authorize',
			redirectUri: 'http://localhost:8080/callback/reddit',
			scopes: ['subscribe', 'vote', 'mysubreddits', 'save', 'read', 'identity', 'edit', 'history'],
			state: 'hoppidihop',
			query: {duration: 'permanent'},
		});
	}

	name(): string {
		return 'reddit';
	}

	async posts(count = 1): Promise<any> {

		return this.request('https://oauth.reddit.com/api/v1/me');
		
		const posts = [];
		for(let i = 0; i < count; i++) {

			const id = + new Date() + i;
			const rand = Math.floor(Math.random() * 600 + 200);
			const text = Math.random() < 0.2 ? undefined : random({min: 2, max: 100});
			const image = !text || Math.random() < 0.2 ? `https://picsum.photos/${rand}` : undefined;
			posts.push({ text, image, id });

		}

	}

}

export default Reddit;