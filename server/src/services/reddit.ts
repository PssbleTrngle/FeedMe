import express from 'express';
import Service from '../service';
import ClientOAuth2 from 'client-oauth2';
import querystring from 'querystring';

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

	async posts(count = 1): Promise<any[]> {

		try {

			const query = querystring.encode({
				limit: count,
				raw_json: 1,
			});

			const response = await this.request(`https://oauth.reddit.com/r/me_irl/top.json?${query}`);
			const unparsed: any[] = JSON.parse(response).data.children;
			const posts = Object.values(unparsed).map((p) => this.parsePost(p));

			return posts;

		} catch(e) {
			return [{text: `Error: ${e}`}]
		}
	}

}

export default Reddit;