import { Express } from 'express';
import ClientOAuth2 from 'client-oauth2';
import request from 'request'
import { User, Options, Auth } from './database';

abstract class Service {

	/**
		Create an OAuth Object
		@return {ClientOAuth2} the object;
	*/
	abstract createOAuth(): ClientOAuth2 | undefined;

	/**
		@return The name of the service. Should be unique
	*/
	abstract name(): string;

	/**
		@param {string} start: The id of the last retrieved post
		@param {number} count: The amount of retrieved posts
		@param {number} index: The amonut of already retrieved posts
		@return {Post[]} the posts retrieved
	*/
	async posts(start?: string, count: number, index = 0): Promise<any[]>;

	/**
		Sends a request to a specified api endpoint using the auth token and parses the data to JSON

		@param {string} url: The API endpoint
		@param {string} method: The HTTP Method
		@return {Object | Array} The data the API sends back
	*/
	async requestJSON(url: string, method: string = 'GET'): Promise<Object | Array> {
		const response = await this.request(url, method);
		if(response) {
			return JSON.parse(response);
		}
		return null;
	}

	/**
		Sends a request to a specified api endpoint using the auth token

		@param {string} url: The API endpoint
		@param {string} method: The HTTP Method
		@return {any} The data the API sends back
	*/
	async request(url: string, method: string = 'GET'): Promise<any> {
		const values: any = { method, url: this.requestURL() + url };
		const user = await User.getUser();

		if(user) {

			const auths = await user.getAuths();
			const auth = auths.find(a => a.service === this.name());
			if(auth) {

				const oauth = this.createOAuth();
				if(!oauth) return null;

				let token = oauth.createToken(auth.accessToken, auth.refreshToken, {});

				values.headers = {
					'Authorization': `bearer ${auth.accessToken}`,
					'User-Agent': 'FeedMe',
				};

				return new Promise((resolve, reject) => {
					request(values, (error, response, body) => {
						if(error) reject(error);
						resolve(body);
					});
				});

			}

		}

		return null;

	}

	/**
		@return {string} The URL a user is sent to to authentificate the service
	*/
	abstract requestURL(): string;

	register(app: Express) {

		const name = this.name();
		const oauth = this.createOAuth();

		if(oauth) {

			app.get(`/register/${name}`, (req, res) => {
				const uri = oauth.code.getUri();
				res.json({uri});
			});

			app.get(`/callback/${name}`, async (req, res) => {

				let answer = await oauth.code.getToken(req.originalUrl);
				answer = await answer.refresh();

				const { accessToken, refreshToken } = answer;

				const user = await User.getUser();
				if(user) await user.authenticate(name, accessToken, refreshToken);

				res.redirect('http://localhost:3000')

			});

		}

	}

	toString() {
		return this.name();
	}

}

export default Service;