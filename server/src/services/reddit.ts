import express from 'express';
import Service from '../service';
import ClientOAuth2 from 'client-oauth2';
import querystring from 'querystring';

class Reddit extends Service {

	/**
		Create an OAuth Object
		@return {ClientOAuth2} the object;
	*/
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


	/**
		@return The name of the service. Should be unique
	*/
	name(): string {
		return 'reddit';
	}

	/**
		Takes the data retrieved from the API and converts them into the Post object

		@param {Object} data: The unparsed data reddit sent
		@return {Post} the parsed post
	*/
	parsePost(data): Object {

		const preview = data.preview || {};
		const images: any[] = preview.images || [];

		return {
			text: data.selftext_html,
			title: data.title,
			id: data.name,
			author: data.author,
			images: images.map(i => {
				const img = {};
				const r: any[] = i.resolutions;
				const v = i.variants

				img.preview = i.source.url;
				img.full = r[r.length - 1].url;
				if(v && v.gif) img.animated = v.gif.source.url;
				return img;
			}),
			sub: data.subreddit,
		}
	}

	/**
		@return {string} The URL a user is sent to to authentificate the service
	*/
	requestURL(): string {
		return 'https://oauth.reddit.com';
	}

	/**
		Retrieves the 'best' posts for the user
		
		@param {string} start: The id of the last retrieved post
		@param {number} count: The amount of retrieved posts
		@param {number} index: The amonut of already retrieved posts
		@return {Post[]} The posts
	*/
	async best(start?: string, count: number, index = 0): Promise<any[]> {

		const query = querystring.encode({
			limit: count,
			raw_json: 1,
			after: start,
			count,
		});

		const response = await this.requestJSON(`/best.json?${query}`);
		const unparsed: any[] = response.data.children;

		return Object.values(unparsed).map((p) => this.parsePost(p.data));
	}


	/**
		@param {string} start: The id of the last retrieved post
		@param {number} count: The amount of retrieved posts
		@param {number} index: The amonut of already retrieved posts
		@return {Post[]} the posts retrieved
	*/
	async posts(start?: string, count: number, index = 0): Promise<any[]> {

		const posts = await this.best(start, count, index);
		return posts;

	}

	/**
		@return the subreddits the user is subscribed to
	*/
	async subreddits() {
		const unparsed = await this.requestJSON('/subreddits/mine.json');
		return unparsed.data.children.map(sub => sub.data.display_name);
	}

}

export default Reddit;