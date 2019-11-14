import express from 'express';
import Service from '../service';
import ClientOAuth2 from 'client-oauth2';
import querystring from 'querystring';

class Twitter extends Service {

	createOAuth(): ClientOAuth2 {
		return new ClientOAuth2({
			clientId: 'c39mLLOKcXu7UEfSvqRL0NhTh ',
			clientSecret: 'OIalSCkD893QBNgJjVtGfhIzFPYPp70kRJFZ98thgii6vMqLgb ',
			accessTokenUri: 'https://api.twitter.com/oauth2/token',
			authorizationUri: 'https://api.twitter.com/oauth2/token',
			redirectUri: 'http://localhost:8080/callback/twitter',
			scopes: ['*'],
			state: 'hoppidihop',
			query: {grant_type: 'client_credentials'},
		});
	}

	name(): string {
		return 'twitter';
	}

	parsePost(unparsed): Object {

		const preview = unparsed.data.preview || {};
		const images: any[] = preview.images || [];

		return {
			text: unparsed.data.selftext_html,
			title: unparsed.data.title,
			id: unparsed.data.name,
			images: images.map(i => i.source.url),
		}
	}

	async posts(start?: string, count = 1): Promise<any[]> {
		return [];
	}

}

export default Twitter;